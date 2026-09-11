const state = {
  page: Number(getParam('page')) || 1,
  sort: getParam('sort') || 'newest',
  search: getParam('search') || '',
  gender: getParam('gender') || '',
  category: getParam('category') || '',
  type: getParam('type') || '',
  minPrice: getParam('minPrice') || '',
  maxPrice: getParam('maxPrice') || '',
  condition: getParam('condition') || ''
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
    const usdRate = await getUsdRate();
    renderPagination(data.pages || 1);

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

    box.innerHTML = `
  <div class="grid">
    ${products.map(p =>
      productCard({
        ...p,
        usdPrice: Math.round(p.price * usdRate)
      })
    ).join('')}
  </div>`;

  } catch (err) {
    box.innerHTML =
      `<div class="empty"><h3>Could not load items</h3></div>`;
  }
}

function renderPagination(totalPages) {
  const el = document.getElementById('pagination');

  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = `
    <div class="flex center gap mt">
      <button class="btn btn-outline btn-sm" id="prevPage"
        ${state.page <= 1 ? 'disabled' : ''}>
        Previous
      </button>

      <span class="muted">Page ${state.page} of ${totalPages}</span>

      <button class="btn btn-outline btn-sm" id="nextPage"
        ${state.page >= totalPages ? 'disabled' : ''}>
        Next
      </button>
    </div>
  `;

  document.getElementById('prevPage').onclick = () => {
    if (state.page > 1) {
      state.page--;
      loadProducts();
    }
  };

  document.getElementById('nextPage').onclick = () => {
    if (state.page < totalPages) {
      state.page++;
      loadProducts();
    }
  };
}

document.getElementById('sort').value = state.sort;

document.getElementById('sort').onchange = e => {
  state.sort = e.target.value;
  state.page = 1;
  loadProducts();
};

function renderFilters() {
  const el = document.getElementById('filters');

  el.innerHTML = `
    <div class="filter-group">
      <h4>Gender</h4>
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
    state.category = '';
    state.type = '';
    state.page = 1;

    renderCategories();
    loadProducts();
  };
});

const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');

minPrice.value = state.minPrice;
maxPrice.value = state.maxPrice;

minPrice.onchange = () => {
  state.minPrice = minPrice.value;
  state.page = 1;
  loadProducts();
};

maxPrice.onchange = () => {
  state.maxPrice = maxPrice.value;
  state.page = 1;
  loadProducts();
};

document.querySelectorAll('.check input').forEach(cb => {
  cb.checked = state.condition === cb.value;

  cb.onchange = () => {
    document.querySelectorAll('.check input').forEach(other => {
      if (other !== cb) other.checked = false;
    });

    state.condition = cb.checked ? cb.value : '';
    state.page = 1;
    loadProducts();
  };
});

document.getElementById('clearFilters').onclick = () => {
  state.page = 1;
  state.sort = 'newest';
  state.gender = '';
  state.category = '';
  state.type = '';
  state.minPrice = '';
  state.maxPrice = '';
  state.condition = '';

  document.getElementById('sort').value = 'newest';

  renderFilters();
  renderCategories();
  renderTypes();
  loadProducts();
};

}

function renderCategories() {
  const el = document.getElementById('categoryGroup');
  const typeEl = document.getElementById('typeGroup');

  if (!state.gender || !CATEGORIES[state.gender]) {
    el.innerHTML = '';
    typeEl.innerHTML = '';
    return;
  }

  const categories = CATEGORIES[state.gender].categories;

  el.innerHTML = `
    <h4>Category</h4>
    ${Object.entries(categories).map(([key, val]) =>
      `<button class="filter-btn" data-category="${key}">
        ${val.label}
      </button>`
    ).join('')}
  `;

  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.onclick = () => {
      state.category = btn.dataset.category;
      state.type = '';
      state.page = 1;

      renderTypes();
      loadProducts();
    };
  });
}

function renderTypes() {
  const el = document.getElementById('typeGroup');

  if (!state.gender || !state.category) {
    el.innerHTML = '';
    return;
  }

  const category = CATEGORIES[state.gender].categories[state.category];

  if (!category) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = `
    <h4>Type</h4>
    ${Object.entries(category.types).map(([key, label]) =>
      `<button class="filter-btn" data-type="${key}">
        ${label}
      </button>`
    ).join('')}
  `;

  document.querySelectorAll('[data-type]').forEach(btn => {
    btn.onclick = () => {
      state.type = btn.dataset.type;
      state.page = 1;
      loadProducts();
    };
  });

}

renderFilters();
renderCategories();
renderTypes();
loadProducts();