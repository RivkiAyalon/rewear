// טוענת ומציגה עד 8 מוצרים בעמוד הבית
async function loadLatest() {
  // האזור בעמוד שבו יוצגו המוצרים
  const box = document.getElementById('latest');

  try {
    // מביא מהשרת עד 8 מוצרים
    const data = await api('/api/products?limit=8');
    // לוקח את מערך המוצרים מתוך תשובת השרת
    const products = data.products || data;
    // מביא את שער ההמרה משקל לדולר
    const usdRate = await getUsdRate();

    if (!products.length) {
      box.innerHTML = '<div class="empty"><h3>No items yet</h3></div>';
      return;
    }
    // יוצר כרטיס לכל מוצר ומציג את המוצרים בעמוד
    box.innerHTML = `
  <div class="grid">
    ${products.map(p =>
      productCard({
        ...p,
        // מוסיף לכל מוצר מחיר משוער בדולר
        usdPrice: Math.round(p.price * usdRate)
      })
    ).join('')}
  </div>`;
  // מעדכן אילו לבבות מסומנים כמועדפים
  await refreshFavoriteHearts();

  } catch (err) {
    box.innerHTML = `<div class="empty"><h3>Could not load items</h3>
                     <p class="muted">${err.message}</p></div>`;
  }
}
// מפעיל את טעינת המוצרים כשעמוד הבית נפתח
loadLatest();