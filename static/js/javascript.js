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
    const address = ref('');
    const quantity = ref(1);
    const deliveryDate = ref('');
    const deliveryTime = ref('');
    const touched = ref({});

    const wishBurgerId = computed(() => {
      const wb = burgers.value.find((b) => b.name === 'Wish Burger');
      return wb ? wb._id : null;
    });

    const isWishBurger = computed(() => selectedBurger.value === wishBurgerId.value);

    const availableToppings = computed(() => toppings.value.filter((t) => t.available));

    const isFormValid = computed(() => {
      if (!selectedBurger.value) return false;
      if (isWishBurger.value && (!selectedPatty.value || !selectedBun.value)) return false;
      if (customerName.value.trim().length < 2) return false;
      if (address.value.trim().length < 5) return false;
      if (quantity.value < 1 || quantity.value > 20) return false;
      if (!deliveryDate.value || !deliveryTime.value) return false;
      return true;
    });

    async function fetchData() {
      try {
        const response = await fetch('/backend', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const result = await response.json();
        toppings.value = result.toppings.map((i) => ({
          ...i,
          upcharge: Number(i.upcharge) || 0,
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
      touched.value = { burger: true, patty: true, bun: true, name: true, address: true, quantity: true, date: true, time: true };
      if (!isFormValid.value) return;
      submitError.value = null;
      const body = {
        burgerId: selectedBurger.value,
        customerName: customerName.value.trim(),
        address: address.value.trim(),
        quantity: quantity.value,
        deliveryDate: deliveryDate.value,
        deliveryTime: deliveryTime.value,
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
          submitError.value = result.errors ? result.errors.join(' ') : 'Order failed.';
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
      customerName, address, quantity, deliveryDate, deliveryTime,
      touched, isWishBurger, availableToppings, isFormValid, submitOrder,
    };
  },
});

app.mount('#app');