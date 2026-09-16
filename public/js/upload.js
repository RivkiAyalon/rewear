// ============================================
// העלאת תמונות מוצר ל-Cloudinary
// ============================================
// הדפדפן מעלה את הקובץ ישירות ל-Cloudinary ומקבל בחזרה
// כתובת URL. רק ה-URL נשמר במונגו — לא התמונה עצמה.
// השרת שלנו לא נוגע בקובץ בכלל.
// ============================================

// הפרטים של החשבון שלנו ב-Cloudinary.
// אלה לא סודות — הם רצים בדפדפן ממילא וכל אחד רואה אותם.
// מה שמאפשר את זה הוא ה-preset במצב Unsigned.
const CLOUD_NAME = 'bcs2gb7g'; 
const PRESET     = 'rewear_unsigned';

// תפיסת האלמנטים מהטופס ב-profile.html
const imageInput   = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');

// משתנה גלובלי (window) כדי ש-products.js יוכל לקרוא ממנו
// את כתובות התמונות ברגע שליחת הטופס
window.uploadedImageUrls = [];


// ============================================
// מעלה קובץ אחד ל-Cloudinary ומחזירה את ה-URL שלו
// ============================================
async function uploadToCloudinary(file) {

  // FormData ולא JSON — כי שולחים קובץ ולא טקסט.
  // שימו לב: לא מוסיפים Content-Type ידנית!
  // הדפדפן קובע אותו לבד עם "גבול" מיוחד שהקובץ צריך.
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );

  if (!res.ok) {
    throw new Error('Image upload failed');
  }

  const data = await res.json();

  // secure_url היא הכתובת ב-https — זו שנשמרת במוצר
  return data.secure_url;
}


// ============================================
// מה שקורה כשבוחרים קבצים
// ============================================
if (imageInput) {

  imageInput.addEventListener('change', async (e) => {

    // FileList הוא לא מערך אמיתי, אז ממירים אותו
    // כדי שנוכל להשתמש ב-map
    const files = Array.from(e.target.files);

    // הגבלה לעד 4 תמונות
    if (files.length > 4) {
      showToast('You can upload up to 4 images', 'error');
      imageInput.value = '';
      return;
    }

    // מציגים ספינר ומאפסים את הרשימה הקודמת
    imagePreview.innerHTML = '<div class="spinner"></div>';
    window.uploadedImageUrls = [];

    // נועלים את השדה כדי שלא יבחרו קבצים חדשים
    // באמצע ההעלאה ויקבלו תוצאה מבולבלת
    imageInput.disabled = true;

    try {
      // Promise.all מעלה את כל התמונות במקביל ולא בזו אחר זו.
      // עם 4 תמונות זה ההבדל בין 2 שניות ל-8.
      const urls = await Promise.all(files.map(uploadToCloudinary));

      // שומרים ב-window כדי ש-products.js יקרא מכאן
      window.uploadedImageUrls = urls;

      // תצוגה מקדימה — עכשיו מהכתובות האמיתיות ב-Cloudinary,
      // כלומר רואים בדיוק את מה שיישמר במוצר
      imagePreview.innerHTML = urls
        .map(url => `<img src="${url}" class="upload-thumb">`)
        .join('');

    } catch (err) {
      imagePreview.innerHTML = '';
      showToast('Could not upload images. Please try again.', 'error');

    } finally {
      // finally רץ תמיד — גם בהצלחה וגם בכישלון.
      // חשוב, אחרת השדה יישאר נעול אחרי שגיאה.
      imageInput.disabled = false;
    }
  });
}