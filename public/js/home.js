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

// Shared card markup — other pages will use this too
function productCard(p) {
  return `
    <a href="/product.html?id=${p._id}" class="card">
      <div class="card-media">
        <img src="${p.images?.[0] || ''}" alt="${p.title}">
        ${p.status === 'sold' ? '<span class="badge badge-sold card-fav">Sold</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-brand">${p.brand || ''}</div>
        <div class="card-title">${p.title}</div>
        <div class="card-meta">${p.size} · ${p.condition}</div>
        <div class="card-price">${formatPrice(p.price)}</div>
      </div>
    </a>
  `;
}

loadLatest();