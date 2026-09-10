const state = {
  page: 1,
  sort: 'newest',
  gender: getParam('gender') || ''
};

async function loadProducts() {
  const box = document.getElementById('results');
  box.innerHTML = '<div class="spinner"></div>';

  const params = new URLSearchParams();

  Object.entries(state).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });

  history.replaceState(null, '', '?' + params);
  
  try {
    const data = await api(`/api/products?${params}`);
    const products = data.products || data;

    document.getElementById('resultCount').textContent =
      `${data.total ?? products.length} items`;

    if (!products.length) {
      box.innerHTML = `
        <div class="empty">
          <h3>No items found</h3>
          <p>Try removing some filters.</p>
        </div>
      `;
      return;
    }

    box.innerHTML =
      `<div class="grid">${products.map(productCard).join('')}</div>`;

  } catch (err) {
    box.innerHTML =
      `<div class="empty"><h3>Could not load items</h3></div>`;
  }
}

document.getElementById('sort').onchange = e => {
  state.sort = e.target.value;
  state.page = 1;
  loadProducts();
};

function renderFilters() {
  const el = document.getElementById('filters');

  el.innerHTML = `
    <div class="filter-group">
      <h4>Category</h4>
      ${Object.entries(CATEGORIES).map(([key, val]) =>
        `<button class="filter-btn" data-gender="${key}">
          ${val.label}
        </button>`
      ).join('')}
    </div>

    <div class="filter-group" id="categoryGroup"></div>

    <div class="filter-group" id="typeGroup"></div>

    <div class="filter-group">
      <h4>Price</h4>
      <div class="flex gap-sm">
        <input class="input" id="minPrice" placeholder="Min" type="number">
        <input class="input" id="maxPrice" placeholder="Max" type="number">
      </div>
    </div>

    <div class="filter-group">
      <h4>Condition</h4>
      ${Object.entries(CONDITIONS).map(([key, label]) =>
        `<label class="check">
          <input type="checkbox" value="${key}">
          ${label}
        </label>`
      ).join('')}
    </div>

    <button class="btn btn-ghost btn-sm" id="clearFilters">
      Clear all
    </button>
  `;

  document.querySelectorAll('[data-gender]').forEach(btn => {
  btn.onclick = () => {
    state.gender = btn.dataset.gender;
    state.page = 1;
    loadProducts();
  };
});
}

renderFilters();
loadProducts();