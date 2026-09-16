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

// ============================================
// שליחת טופס פרסום המוצר
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  const publishForm = document.getElementById('publish-form');

  // אם אנחנו לא בעמוד עם הטופס — לא עושים כלום
  if (!publishForm) return;

  publishForm.addEventListener('submit', async (e) => {

    // מונע מהדפדפן לרענן את העמוד
    // (זו התנהגות ברירת המחדל של form)
    e.preventDefault();

    // ============================================
    // 1. איסוף הנתונים מהטופס
    // ============================================
    const productData = {
      title:       document.getElementById('title').value.trim(),
      price:       Number(document.getElementById('price').value),
      description: document.getElementById('description').value.trim(),
      brand:       document.getElementById('brand')?.value.trim() || 'No brand',
      gender:      document.getElementById('gender').value,
      category:    document.getElementById('category').value,
      type:        document.getElementById('type').value,
      size:        document.getElementById('size').value,
      condition:   document.getElementById('condition').value,
      color:       document.getElementById('color')?.value.trim() || '',
      city:        document.getElementById('city').value,

      // הכתובות שחזרו מ-Cloudinary ב-upload.js
      images: window.uploadedImageUrls || []
    };

    // ============================================
    // 2. ולידציה בצד לקוח
    // ============================================
    // זו נוחות בלבד! אפשר לעקוף אותה דרך Postman.
    // ההגנה האמיתית היא במודל Product ובקונטרולר.

    if (!productData.title) {
      return showToast('Please add a title', 'error');
    }
    if (!productData.price || productData.price <= 0) {
      return showToast('Please enter a valid price', 'error');
    }
    if (!productData.gender || !productData.category ||
        !productData.type || !productData.size) {
      return showToast('Please complete all category fields', 'error');
    }
    if (!productData.images.length) {
      return showToast('Please add at least one image', 'error');
    }

    // ============================================
    // 3. נעילת הכפתור
    // ============================================
    // בלי זה, לחיצה כפולה מהירה תיצור שני מוצרים זהים
    const submitBtn = publishForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';

    try {
      
      // בודקים אם זו עריכה או יצירה חדשה
      const editId = publishForm.dataset.editId;

      if (editId) {
        await api(`/api/products/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(productData)
        });
        showToast('Your item was updated', 'success');
      } else {
        await api('/api/products', {
          method: 'POST',
          body: JSON.stringify(productData)
        });
        showToast('Your item was published', 'success');
      }

      // מנקים את מצב העריכה
      delete publishForm.dataset.editId;

      setTimeout(() => {
        window.location.href = '/profile.html?tab=items';
      }, 900);


    } catch (err) {
      // err.message מגיע מהשרת — זו ההודעה
      // שהקונטרולר החזיר ב-{ message: ... }
      showToast(err.message, 'error');

      submitBtn.disabled = false;
      submitBtn.textContent = 'Publish item';
    }
  });
});