// שומר את המצב הנוכחי של החיפוש והפילטרים
// כשהעמוד נטען מחדש, getParam קורא את הערכים מהURL ומכניס אותם שוב לstate
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
//טוענת ומציגה את המוצרים לפי הstate
async function loadProducts() {
  const box = document.getElementById('results');
  box.innerHTML = '<div class="spinner"></div>';

  // יוצר אובייקט ריק לפרמטרים
  const params = new URLSearchParams();
  // ממלא את האובייקט בערכים
  Object.entries(state).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });

  // מציג אותם ב־URL בלי לרענן את הדף
  history.replaceState(null, '', '?' + params);

  try {
    // שולחת את התנאים לשרת
    const data = await api(`/api/products?${params}`);
    // השרת מחזיר תשובה, כלומר מחזיר את המוצרים המתאימים
    const products = data.products || data;
    // מביא שער המרה משקל לדולר
    const usdRate = await getUsdRate();
    renderPagination(data.pages || 1);
    // מציג כמה מוצרים נמצאו
    document.getElementById('resultCount').textContent =
      `${data.total ?? products.length} items`;
    // אם לא נמצאו מוצרים
    if (!products.length) {
      box.innerHTML = `
        <div class="empty">
          <h3>No items found</h3>
          <p>Try removing some filters.</p>
        </div>
      `;
      return;
    }
    // יוצר כרטיס לכל מוצר
    box.innerHTML = `
  <div class="grid">
    ${products.map(p =>
      productCard({
        ...p,
        // מחשב מחיר משוער בדולר
        usdPrice: Math.round(p.price * usdRate)
      })
    ).join('')}
  </div>`;
  // מעדכן אילו לבבות מסומנים כמועדפים
  await refreshFavoriteHearts();

  } catch (err) {
    box.innerHTML =
      `<div class="empty"><h3>Could not load items</h3></div>`;
  }
}
// יוצרת את כפתורי Previous / Next
function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
// אם יש רק עמוד אחד - אין צורך בדפדוף
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
  // עובר לעמוד הקודם
  document.getElementById('prevPage').onclick = () => {
    if (state.page > 1) {
      state.page--;
      loadProducts();
    }
  };
  // עובר לעמוד הבא
  document.getElementById('nextPage').onclick = () => {
    if (state.page < totalPages) {
      state.page++;
      loadProducts();
    }
  };
}
// מציג ב-select את המיון הנוכחי
document.getElementById('sort').value = state.sort;
// משנה מיון וטוען מחדש את המוצרים
document.getElementById('sort').onchange = e => {
  state.sort = e.target.value;
  // בכל שינוי מתחילים שוב מעמוד 1
  state.page = 1;
  loadProducts();
};

// שדה החיפוש
const searchInput = document.getElementById('searchInput');
// מציג חיפוש קיים מה-URL
searchInput.value = state.search;
// מבצעת חיפוש
function doSearch() {
  state.search = searchInput.value.trim();
  state.page = 1;
  loadProducts();
}
// חיפוש בלחיצה על הכפתור
document.getElementById('searchBtn').onclick = doSearch;
// חיפוש גם בלחיצה על Enter
searchInput.onkeydown = e => {
  if (e.key === 'Enter') doSearch();
};
// יוצרת את אזור הפילטרים
function renderFilters() {
  const el = document.getElementById('filters');
// בונה Gender, Price, Condition ו-Clear all
  el.innerHTML = `
    <div class="filter-group">
      <div class="flex between center">
        <h4>Gender</h4>
        ${state.gender ? `
          <button class="btn btn-ghost btn-sm" id="clearGender">
            Clear
          </button>
        ` : ''}
      </div>
      ${Object.entries(CATEGORIES).map(([key, val]) =>
        `<button
          class="filter-btn ${state.gender === key ? 'active' : ''}"
          data-gender="${key}">
          ${val.label}
        </button>`
      ).join('')}
    </div>

    <div class="filter-group" id="categoryGroup"></div>

    <div class="filter-group" id="typeGroup"></div>

    <div class="filter-group">
      <div class="flex between center">
        <h4>Price</h4>
          <button
            class="btn btn-ghost btn-sm ${state.minPrice || state.maxPrice ? '' : 'hidden'}"
            id="clearPrice">
            Clear
          </button>
      </div>

      <div class="flex gap-sm">
        <input class="input" id="minPrice" placeholder="Min" type="number">
        <input class="input" id="maxPrice" placeholder="Max" type="number">
      </div>
    </div>

    <div class="filter-group">
      <div class="flex between center">
        <h4>Condition</h4>
        ${state.condition ? `
          <button class="btn btn-ghost btn-sm" id="clearCondition">
            Clear
          </button>
        ` : ''}
      </div>
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
// מטפל בבחירת Gender
document.querySelectorAll('[data-gender]').forEach(btn => {
  btn.onclick = () => {
    // שומר את ה-Gender שנבחר
    state.gender = btn.dataset.gender;
    // Category ו-Type תלויים ב-Gender ולכן מתאפסים
    state.category = '';
    state.type = '';
    state.page = 1;

    renderFilters();
    renderCategories();
    loadProducts();
  };
});

const clearGender = document.getElementById('clearGender');
// מנקה Gender וגם את הילדים שלו
if (clearGender) {
  clearGender.onclick = () => {
    state.gender = '';
    state.category = '';
    state.type = '';
    state.page = 1;

    renderFilters();
    renderCategories();
    renderTypes();
    loadProducts();
  };
}

const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');
const clearPrice = document.getElementById('clearPrice');

minPrice.value = state.minPrice;
maxPrice.value = state.maxPrice;
// שומר את הטיימר של ה-debounce
let priceTimer;
// מעדכנת את פילטר המחיר בזמן ההקלדה
function updatePriceFilter() {
  state.minPrice = minPrice.value;
  state.maxPrice = maxPrice.value;
  state.page = 1;

  clearPrice.classList.toggle(
    'hidden',
    !state.minPrice && !state.maxPrice
  );

  clearTimeout(priceTimer);
// debounce - מחכה 300ms לפני שליחת הבקשה
  priceTimer = setTimeout(() => {
    loadProducts();
  }, 300);
}

minPrice.oninput = updatePriceFilter;
maxPrice.oninput = updatePriceFilter;

clearPrice.onclick = () => {
  state.minPrice = '';
  state.maxPrice = '';
  state.page = 1;

  minPrice.value = '';
  maxPrice.value = '';

  clearPrice.classList.add('hidden');

  loadProducts();
};
 // מטפל בבחירת Condition
document.querySelectorAll('.check input').forEach(cb => {
  cb.checked = state.condition === cb.value;

  cb.onchange = () => {
    // מאפשר בחירה של Condition אחד בלבד
    document.querySelectorAll('.check input').forEach(other => {
      if (other !== cb) other.checked = false;
    });
  // שומר את ה-Condition שנבחר
    state.condition = cb.checked ? cb.value : '';
    state.page = 1;

    renderFilters();
    renderCategories();
    renderTypes();
    loadProducts();
  };
});

const clearCondition = document.getElementById('clearCondition');
 // מנקה את פילטר Condition
if (clearCondition) {
  clearCondition.onclick = () => {
    state.condition = '';
    state.page = 1;

    renderFilters();
    renderCategories();
    renderTypes();
    loadProducts();
  };
}
// מאפס את כל החיפוש והפילטרים
document.getElementById('clearFilters').onclick = () => {
  state.page = 1;
  state.sort = 'newest';
  state.search = '';
  state.gender = '';
  state.category = '';
  state.type = '';
  state.minPrice = '';
  state.maxPrice = '';
  state.condition = '';
  searchInput.value = '';

  document.getElementById('sort').value = 'newest';

  renderFilters();
  renderCategories();
  renderTypes();
  loadProducts();
};

}
// מציגה Categories לפי ה-Gender שנבחר
function renderCategories() {
  const el = document.getElementById('categoryGroup');
  const typeEl = document.getElementById('typeGroup');
// בלי Gender אין Categories או Types
  if (!state.gender || !CATEGORIES[state.gender]) {
    el.innerHTML = '';
    typeEl.innerHTML = '';
    return;
  }
// לוקח את הקטגוריות של ה-Gender שנבחר
  const categories = CATEGORIES[state.gender].categories;
// יוצר את כפתורי ה-Category
  el.innerHTML = `
    <div class="flex between center">
      <h4>Category</h4>
      ${state.category ? `
        <button class="btn btn-ghost btn-sm" id="clearCategory">
          Clear
        </button>
      ` : ''}
    </div>
    ${Object.entries(categories).map(([key, val]) =>
      `<button
        class="filter-btn ${state.category === key ? 'active' : ''}"
        data-category="${key}">
        ${val.label}
      </button>`
    ).join('')}
  `;

  document.querySelectorAll('[data-category]').forEach(btn => {
  btn.onclick = () => {
    state.category = btn.dataset.category;
    // Type תלוי ב-Category ולכן מתאפס
    state.type = '';
    state.page = 1;

    renderCategories();
    renderTypes();
    loadProducts();
    };
  });

  const clearCategory = document.getElementById('clearCategory');
  
  //מנקה Category Type שתלוי בו
  if (clearCategory) {
    clearCategory.onclick = () => {
      state.category = '';
      state.type = '';
      state.page = 1;
  
      renderCategories();
      renderTypes();
      loadProducts();
    };
  }
}

// מציגה Types לפי Gender ו-Category
function renderTypes() {
  const el = document.getElementById('typeGroup');
// בלי Gender ו-Category אין Type
  if (!state.gender || !state.category) {
    el.innerHTML = '';
    return;
  }

  const category = CATEGORIES[state.gender].categories[state.category];

  if (!category) {
    el.innerHTML = '';
    return;
  }
// יוצר את כפתורי ה-Type
  el.innerHTML = `
    <div class="flex between center">
      <h4>Type</h4>
      ${state.type ? `
        <button class="btn btn-ghost btn-sm" id="clearType">
          Clear
        </button>
      ` : ''}
    </div>
    ${Object.entries(category.types).map(([key, label]) =>
      `<button
        class="filter-btn ${state.type === key ? 'active' : ''}"
        data-type="${key}">
        ${label}
      </button>`
    ).join('')}
  `;

  document.querySelectorAll('[data-type]').forEach(btn => {
  btn.onclick = () => {
  state.type = btn.dataset.type;
  state.page = 1;

  renderTypes();
  loadProducts();
  };
});

const clearType = document.getElementById('clearType');
// מנקה רק את Type
if (clearType) {
  clearType.onclick = () => {
    state.type = '';
    state.page = 1;

    renderTypes();
    loadProducts();
  };
}

}
// אתחול עמוד החנות
renderFilters();
renderCategories();
renderTypes();
loadProducts();