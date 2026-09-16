// תפיסת האלמנטים לפי ה-IDs הקיימים ב-profile.html
const genderSelect = document.getElementById('gender');
const categorySelect = document.getElementById('category');
const typeSelect = document.getElementById('type');
const sizeSelect = document.getElementById('size');

// מילוי קטגוריות מתוך categories.js
function fillCategories(gender) {
  if (typeof CATEGORIES === 'undefined' || !CATEGORIES[gender]) return;
  const cats = CATEGORIES[gender].categories;
  categorySelect.innerHTML = '<option value="">Select category</option>' +
    Object.entries(cats)
      .map(([key, val]) => `<option value="${key}">${val.label}</option>`)
      .join('');
}

// מילוי סוגי פריטים מתוך categories.js
function fillTypes(gender, category) {
  if (typeof CATEGORIES === 'undefined' || !CATEGORIES[gender]?.categories[category]) return;
  const types = CATEGORIES[gender].categories[category].types;
  typeSelect.innerHTML = '<option value="">Select type</option>' +
    Object.entries(types)
      .map(([key, label]) => `<option value="${key}">${label}</option>`)
      .join('');
}

// מילוי מידות מתוך categories.js
function fillSizes(gender, category) {
  if (typeof SIZES === 'undefined') return;
  let sizes;
  if (gender === 'kids') {
    sizes = category === 'shoes' ? SIZES.kidsShoes : SIZES.kidsClothing;
  } else if (category === 'shoes') {
    sizes = SIZES.shoes;
  } else if (category === 'accessories') {
    sizes = SIZES.accessories;
  } else {
    sizes = SIZES.clothing;
  }

  sizeSelect.innerHTML = '<option value="">Select size</option>' +
    sizes.map(s => `<option value="${s}">${s}</option>`).join('');
}

// אירוע שינוי במגדר
if (genderSelect) {
  genderSelect.addEventListener('change', (e) => {
    const gender = e.target.value;
    if (gender) {
      categorySelect.disabled = false;
      fillCategories(gender);
    } else {
      categorySelect.disabled = true;
      categorySelect.innerHTML = '<option value="">Select category</option>';
    }
    typeSelect.disabled = true;
    typeSelect.innerHTML = '<option value="">Select type</option>';
    sizeSelect.disabled = true;
    sizeSelect.innerHTML = '<option value="">Select size</option>';
  });
}

// אירוע שינוי בקטגוריה
if (categorySelect) {
  categorySelect.addEventListener('change', (e) => {
    const gender = genderSelect.value;
    const category = e.target.value;
    if (category) {
      typeSelect.disabled = false;
      sizeSelect.disabled = false;
      fillTypes(gender, category);
      fillSizes(gender, category);
    } else {
      typeSelect.disabled = true;
      sizeSelect.disabled = true;
    }
  });
}