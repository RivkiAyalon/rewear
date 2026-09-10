async function loadLatest() {
  const box = document.getElementById('latest');

  try {
    const data = await api('/api/products?limit=8');
    const products = data.products || data;

    if (!products.length) {
      box.innerHTML = '<div class="empty"><h3>No items yet</h3></div>';
      return;
    }

    box.innerHTML = `<div class="grid">${products.map(productCard).join('')}</div>`;
  } catch (err) {
    box.innerHTML = `<div class="empty"><h3>Could not load items</h3>
                     <p class="muted">${err.message}</p></div>`;
  }
}

loadLatest();