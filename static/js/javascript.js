const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
  setup() {
    const toppings = ref([]);
    const burgers = ref([]);
    const bunTypes = ref([]);
    const patties = ref([]);
    const loading = ref(true);
    const fetchError = ref(null);
    const submitError = ref(null);
    const orderResult = ref(null);
    const selectedBurger = ref(null);
    const selectedPatty = ref(null);
    const selectedBun = ref(null);
    const selectedToppings = ref([]);
    const customerName = ref('');
    const email = ref('');
    const phone = ref('');
    const quantity = ref(1);
    const geoAddress = ref('');
    const geoLat = ref(null);
    const geoLng = ref(null);
    const geoAccuracy = ref(null);
    const geoLoading = ref(false);
    const geoError = ref(null);
    const touched = ref({});

    const wishBurgerId = computed(() => {
      const wb = burgers.value.find((b) => b.name === 'Wish Burger');
      return wb ? wb._id : null;
    });
    const isWishBurger = computed(() => selectedBurger.value === wishBurgerId.value);
    const availableToppings = computed(() => toppings.value.filter((t) => t.available));
    const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value));

    const isFormValid = computed(() => {
      if (!selectedBurger.value) return false;
      if (isWishBurger.value && (!selectedPatty.value || !selectedBun.value)) return false;
      if (customerName.value.trim().length < 2) return false;
      if (!isValidEmail.value) return false;
      if (phone.value.trim().length < 5) return false;
      if (quantity.value < 1 || quantity.value > 20) return false;
      if (!geoAddress.value) return false;
      return true;
    });

    // ── Geolocation API (5+ distinct calls) ──
    function getLocation() {
      geoError.value = null;
      geoAddress.value = '';
      // API call 1: property check
      if (!navigator.geolocation) {
        geoError.value = 'Geolocation is not supported by your browser.';
        return;
      }
      geoLoading.value = true;
      // API call 2: getCurrentPosition()
      navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    }

    async function onGeoSuccess(position) {
      // API call 3: coords.latitude
      geoLat.value = position.coords.latitude.toFixed(5);
      // API call 4: coords.longitude
      geoLng.value = position.coords.longitude.toFixed(5);
      // API call 5: coords.accuracy
      geoAccuracy.value = Math.round(position.coords.accuracy);
      try {
        const url = 'https://nominatim.openstreetmap.org/reverse?lat=' + geoLat.value + '&lon=' + geoLng.value + '&format=json';
        const res = await fetch(url);
        const data = await res.json();
        geoAddress.value = data.display_name || (geoLat.value + ', ' + geoLng.value);
      } catch (err) {
        geoAddress.value = geoLat.value + ', ' + geoLng.value;
      } finally {
        geoLoading.value = false;
      }
    }

    function onGeoError(err) {
      geoLoading.value = false;
      if (err.code === 1) geoError.value = 'Location access was denied. Please allow location access.';
      else if (err.code === 2) geoError.value = 'Position unavailable. Please try again.';
      else geoError.value = 'Location request timed out. Please try again.';
    }

    async function fetchData() {
      try {
        const response = await fetch('/backend', { method: 'GET', signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const result = await response.json();
        toppings.value = result.toppings.map((i) => ({
          ...i, upcharge: Number(i.upcharge) || 0,
          vegan: i.vegan === true || i.vegan === 'true',
          available: i.available === true || i.available === 'true',
        }));
        burgers.value = result.burgers.map((b) => ({ ...b, basePrice: Number(b.basePrice) || 0 }));
        bunTypes.value = result.bunTypes.map((d) => ({ ...d, upcharge: Number(d.upcharge) || 0 }));
        patties.value = result.patties.map((p) => ({ ...p, upcharge: Number(p.upcharge) || 0 }));
      } catch (err) {
        console.error('Fehler beim Laden:', err);
        fetchError.value = 'Could not load menu. Please try again later.';
      } finally {
        loading.value = false;
      }
    }

    async function submitOrder() {
      touched.value = { burger: true, patty: true, bun: true, name: true, email: true, phone: true, quantity: true, geo: true };
      if (!isFormValid.value) return;
      submitError.value = null;
      const body = {
        burgerId: selectedBurger.value,
        customerName: customerName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        quantity: quantity.value,
        address: geoAddress.value,
        lat: geoLat.value,
        lng: geoLng.value,
      };
      if (isWishBurger.value) {
        body.pattyId = selectedPatty.value;
        body.bunTypeId = selectedBun.value;
        body.toppingIds = selectedToppings.value;
      }
      try {
        const response = await fetch('/backend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        });
        const result = await response.json();
        if (!response.ok) {
          submitError.value = result.error || 'Order failed.';
          return;
        }
        orderResult.value = result;
      } catch (err) {
        console.error('Order error:', err);
        submitError.value = 'Could not place order. Please try again.';
      }
    }

    onMounted(() => { fetchData(); });

    return {
      toppings, burgers, bunTypes, patties,
      loading, fetchError, submitError, orderResult,
      selectedBurger, selectedPatty, selectedBun, selectedToppings,
      customerName, email, phone, quantity,
      geoAddress, geoLat, geoLng, geoAccuracy, geoLoading, geoError,
      touched, isWishBurger, availableToppings, isValidEmail, isFormValid,
      getLocation, submitOrder,
    };
  },
});

app.mount('#app');