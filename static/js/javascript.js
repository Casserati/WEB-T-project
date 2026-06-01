const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
  setup() {
    const ingredients = ref([]);
    const loading = ref(true);
    const error = ref(null);

    // Group ingredients by category (cheese, meat, vegetable, …)
    const groupedIngredients = computed(() => {
      const groups = {};
      for (const item of ingredients.value) {
        const cat = item.category || 'other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      }
      return groups;
    });

    async function fetchIngredients() {
      try {
        const response = await fetch('/backend', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          throw new Error('HTTP Status: ' + response.status + ' ' + response.statusText);
        }

        const result = await response.json();

        // Normalize vegan / available fields (DB may store strings)
        ingredients.value = result.ingredients.map((i) => ({
          ...i,
          upcharge: Number(i.upcharge) || 0,
          vegan: i.vegan === true || i.vegan === 'true',
          available: i.available === true || i.available === 'true',
        }));
      } catch (err) {
        console.error('Fehler beim Laden:', err);
        error.value = 'Could not load ingredients. Please try again later.';
      } finally {
        loading.value = false;
      }
    }

    onMounted(() => {
      fetchIngredients();
    });

    return {
      ingredients,
      groupedIngredients,
      loading,
      error,
    };
  },
});

app.mount('#app');