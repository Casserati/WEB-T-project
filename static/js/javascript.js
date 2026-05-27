async function init() {
  try {
    const response = await fetch("/backend", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok)
      throw "HTTP Status: " + response.status + " " + response.statusText;
    const result = JSON.parse(await response.text());
    console.log(result.ingredients);
  } catch (error) {
    console.error("Fehler beim Laden:", error);
  }
}
