const { createApp, ref, computed, onMounted, watch } = Vue;
const app = createApp({
  setup() {
    const burgers = ref([]);
    const loading = ref(true);
    const fetchError = ref(null);
    const submitError = ref(null);
    const orderResult = ref(null);
    const lastOrder = ref(null);
    const selectedBurger = ref(null);
    const customerName = ref("");
    const email = ref("");
    const phone = ref("");
    const quantity = ref(1);
    const address = ref("");
    const geoLat = ref(null);
    const geoLng = ref(null);
    const geoAccuracy = ref(null);
    const geoLoading = ref(false);
    const geoError = ref(null);
    const touched = ref({});
    const cart = ref([]);
    const saveDetails = ref(false);
    const menuOpen = ref(false);

    function loadStorage() {
      try {
        const saved = localStorage.getItem("bp_cart");
        if (saved) {
          cart.value = JSON.parse(saved);
        }
        const lo = localStorage.getItem("bp_lastOrder");
        if (lo) {
          lastOrder.value = JSON.parse(lo);
        }
        const sd = localStorage.getItem("bp_saveDetails");
        if (sd === "true") {
          saveDetails.value = true;
          const sa = localStorage.getItem("bp_address");
          if (sa) {
            address.value = sa;
          }
          const sn = localStorage.getItem("bp_name");
          if (sn) {
            customerName.value = sn;
          }
          const se = localStorage.getItem("bp_email");
          if (se) {
            email.value = se;
          }
          const sp = localStorage.getItem("bp_phone");
          if (sp) {
            phone.value = sp;
          }
        }
      } catch (e) {
        console.error("Storage read error", e);
      }
    }
    function saveCart() {
      localStorage.setItem("bp_cart", JSON.stringify(cart.value));
    }
    function saveAddress() {
      if (saveDetails.value) {
        localStorage.setItem("bp_address", address.value);
      } else {
        localStorage.removeItem("bp_address");
      }
    }
    function saveContact() {
      localStorage.setItem("bp_saveDetails", saveDetails.value);
      if (saveDetails.value) {
        localStorage.setItem("bp_name", customerName.value);
        localStorage.setItem("bp_email", email.value);
        localStorage.setItem("bp_phone", phone.value);
      } else {
        localStorage.removeItem("bp_name");
        localStorage.removeItem("bp_email");
        localStorage.removeItem("bp_phone");
        localStorage.removeItem("bp_address");
      }
    }

    const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value));
    const isValidPhone = computed(() => /^(\+41\s?\d{2}|0\d{2})\s?\d{3}\s?\d{2}\s?\d{2}$/.test(phone.value.trim()));
    const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.itemTotal, 0));
    const canAddToCart = computed(() => selectedBurger.value && quantity.value >= 1 && quantity.value <= 20);
    const canOrder = computed(() => {
      if (cart.value.length === 0) {
        return false;
      }
      if (customerName.value.trim().length < 2) {
        return false;
      }
      if (!isValidEmail.value) {
        return false;
      }
      if (!isValidPhone.value) {
        return false;
      }
      if (address.value.trim().length < 3) {
        return false;
      }
      return true;
    });

    function addToCart() {
      if (!canAddToCart.value) {
        return;
      }
      const burger = burgers.value.find((b) => b._id === selectedBurger.value);
      cart.value.push({
        id: Date.now(),
        burgerId: burger._id,
        burgerName: burger.name,
        quantity: quantity.value,
        itemTotal: Math.round(burger.basePrice * quantity.value * 100) / 100,
      });
      saveCart();
      selectedBurger.value = null;
      quantity.value = 1;
    }
    function removeFromCart(id) {
      cart.value = cart.value.filter((item) => item.id !== id);
      saveCart();
    }
    function clearCart() {
      cart.value = [];
      saveCart();
    }

    function getLocation() {
      geoError.value = null;
      if (!navigator.geolocation) {
        geoError.value = "Geolocation not supported.";
        return;
      }
      geoLoading.value = true;
      navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, { enableHighAccuracy: true, timeout: 10000 });
    }
    async function onGeoSuccess(position) {
      geoLat.value = position.coords.latitude.toFixed(5);
      geoLng.value = position.coords.longitude.toFixed(5);
      geoAccuracy.value = Math.round(position.coords.accuracy);
      try {
        const url = "https://nominatim.openstreetmap.org/reverse?lat=" + geoLat.value + "&lon=" + geoLng.value + "&format=json";
        const res = await fetch(url);
        const data = await res.json();
        address.value = data.display_name || geoLat.value + ", " + geoLng.value;
      } catch (e) {
        address.value = geoLat.value + ", " + geoLng.value;
      } finally {
        geoLoading.value = false;
        saveAddress();
      }
    }
    function onGeoError(err) {
      geoLoading.value = false;
      if (err.code === 1) {
        geoError.value = "Location access denied.";
      } else if (err.code === 2) {
        geoError.value = "Position unavailable.";
      } else {
        geoError.value = "Location request timed out.";
      }
    }

    async function fetchData() {
      try {
        const response = await fetch("/backend/burgers", { method: "GET", signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        const result = await response.json();
        burgers.value = result.burgers.map((b) => ({ ...b, basePrice: Number(b.basePrice) || 0 }));
      } catch (err) {
        console.error("Fehler beim Laden:", err);
        fetchError.value = "Could not load menu. Please try again later.";
      } finally {
        loading.value = false;
      }
    }

    async function submitOrder() {
      touched.value = { name: true, email: true, phone: true, address: true, quantity: true };
      if (!canOrder.value) {
        return;
      }
      submitError.value = null;
      const body = {
        cart: cart.value,
        customerName: customerName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        address: address.value.trim(),
        lat: geoLat.value,
        lng: geoLng.value,
      };
      try {
        const response = await fetch("/backend/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        });
        const result = await response.json();
        if (!response.ok) {
          submitError.value = result.error || "Order failed.";
          return;
        }
        orderResult.value = result;
        lastOrder.value = result;
        localStorage.setItem("bp_lastOrder", JSON.stringify(result));
        saveContact();
        saveAddress();
        clearCart();
      } catch (err) {
        console.error("Order error:", err);
        submitError.value = "Could not place order. Please try again.";
      }
    }

    async function fetchLastOrder() {
      if (!email.value) {
        return;
      }
      try {
        const url = "/backend/orders/last?email=" + encodeURIComponent(email.value.trim());
        const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
          return;
        }
        const result = await response.json();
        lastOrder.value = result;
      } catch (e) {
        console.error("Last order fetch:", e);
      }
    }

    watch(address, saveAddress);
    watch(saveDetails, saveContact);
    onMounted(() => {
      loadStorage();
      fetchData();
      fetchLastOrder();
    });

    return { burgers, loading, fetchError, submitError, orderResult, lastOrder, selectedBurger,
      customerName, email, phone, quantity, address, geoLat, geoLng, geoAccuracy, geoLoading,
      geoError, touched, cart, cartTotal, saveDetails, menuOpen, isValidEmail, isValidPhone,
      canAddToCart, canOrder, getLocation, addToCart, removeFromCart, clearCart, submitOrder };
  },
});
app.mount("#app");