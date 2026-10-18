// תפיסת אלמנטים מסוג Select מה-DOM (ממשק המשתמש) לצורך ניהול רשימות נפתחות דינמיות
const genderSelect = document.getElementById('gender');
const categorySelect = document.getElementById('category');
const typeSelect = document.getElementById('type');
const sizeSelect = document.getElementById('size');

// מילוי דינמי של רשימת הקטגוריות בהתאם למגדר שנבחר מתוך קובץ הנתונים categories.js
function fillCategories(gender) {
  if (typeof CATEGORIES === 'undefined' || !CATEGORIES[gender]) return;
  const cats = CATEGORIES[gender].categories;
  categorySelect.innerHTML = '<option value="">Select category</option>' +
    Object.entries(cats)
      .map(([key, val]) => `<option value="${key}">${val.label}</option>`)
      .join('');
}

// מילוי דינמי של תתי-סוגי הפריטים (Types) בהתאם למגדר ולקטגוריה שנבחרו
function fillTypes(gender, category) {
  if (typeof CATEGORIES === 'undefined' || !CATEGORIES[gender]?.categories[category]) return;
  const types = CATEGORIES[gender].categories[category].types;
  typeSelect.innerHTML = '<option value="">Select type</option>' +
    Object.entries(types)
      .map(([key, label]) => `<option value="${key}">${label}</option>`)
      .join('');
}

// מילוי דינמי של רשימת המידות (Sizes) לפי הקטגוריה והמגדר (בגדי ילדים, נעליים, אביזרים או ביגוד)
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

// מאזין אירועים (Event Listener) לשינוי בשדה המגדר - מעדכן ומאפשר את רשימת הקטגוריות ומאפס שדות סמוכים
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

// מאזין אירועים לשינוי בשדה הקטגוריה - מעדכן ומאפשר את שדות סוג הפריט והמידות
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
// טיפול באירוע שליחת טופס פרסום/עריכת מוצר (Form Submission)
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  const publishForm = document.getElementById('publish-form');

  // בדיקה אם הטופס קיים בדף הנוכחי למניעת שגיאות הרצה
  if (!publishForm) return;

  publishForm.addEventListener('submit', async (e) => {

    // מניעת התנהגות ברירת המחדל של הדפדפן (Prevent Default Page Refresh) כדי לבצע שליחה באסינכרוניות (AJAX/Fetch)
    e.preventDefault();

    // ============================================
    // 1. איסוף נתוני השדות מהטופס ובניית אובייקט המוצר
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

      // שליפת כתובות התמונות שהועלו לענן של Cloudinary דרך המשתנה הגלובלי מ-upload.js
      images: window.uploadedImageUrls || []
    };

    // ============================================
    // 2. ולידציה בצד הלקוח (Client-Side Validation)
    // ============================================
    // בדיקת תקינות השדות בדפדפן לפני פנייה לשרת - לשיפור חווית המשתמש (הוולידציה הראשית מבוצעת בשרת)

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
    // 3. נעילת כפתור השליחה (UI Debouncing / Preventing Double Submit)
    // ============================================
    // מניעת קריאות כפולות לשרת ושליחות כפולות בעת לחיצה מהירה
    const submitBtn = publishForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';

    try {
      
      // בדיקת מצב הטופס: אם קיים Dataset Edit ID - מדובר בעדכון פריט (PUT), אחרת ביצירת פריט חדש (POST)
      const editId = publishForm.dataset.editId;

      if (editId) {
        // שליחת בקשת PUT לעדכון מוצר קיים מול ה-API בשרת
        await api(`/api/products/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(productData)
        });
        showToast('Your item was updated', 'success');
      } else {
        // שליחת בקשת POST ליצירת מוצר חדש מול ה-API בשרת
        await api('/api/products', {
          method: 'POST',
          body: JSON.stringify(productData)
        });
        showToast('Your item was published', 'success');
      }

      // איפוס מזהה העריכה מהטופס
      delete publishForm.dataset.editId;

      // העברת המשתמשת לעמוד הפרופיל (טאב המוצרים שלי) לאחר הפעולה
      setTimeout(() => {
        window.location.href = '/profile.html?tab=items';
      }, 900);


    } catch (err) {
      // טיפול בשגיאות שחזרו מהשרת והצגת הודעת שגיאה בממשק (Toast Notification)
      showToast(err.message, 'error');

      // שחרור נעילת כפתור השליחה במקרה של כישלון
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publish item';
    }
  });
});