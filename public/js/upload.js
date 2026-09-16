const imageInput = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
//let uploadedImageUrls = [];
window.uploadedImageUrls = [];//כדי לאפשר העלאת תמונות

if (imageInput) {
  imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    // הגבלה לעד 4 תמונות
    if (files.length > 4) {
      alert('You can only upload up to 4 images.');
      imageInput.value = '';
      imagePreview.innerHTML = '';
      return;
    }

    imagePreview.innerHTML = '';

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        window.uploadedImageUrls.push(event.target.result);
        const img = document.createElement('img');
        img.src = event.target.result;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '1px solid #ccc';
        imagePreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}


//////
// האזנה לשליחת טופס הפרסום והוספת המוצר למסד הנתונים
document.addEventListener('DOMContentLoaded', () => {
  const publishForm = document.getElementById('publish-form');
  
  if (!publishForm) return;

  publishForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. בדיקת טוקן אימות
    const token = localStorage.getItem('rewear_token') || localStorage.getItem('token');    if (!token) {
      alert('אינך מחוברת! אנא התחברי מחדש כדי לפרסם מוצר.');
      window.location.href = '/login.html';
      return;
    }

    // 2. איסוף הנתונים מהטופס
    const productData = {
      title: document.getElementById('title')?.value,
      price: Number(document.getElementById('price')?.value),
      description: document.getElementById('description')?.value || '',
      gender: document.getElementById('gender')?.value,
      category: document.getElementById('category')?.value,
      type: document.getElementById('type')?.value || '',
      size: document.getElementById('size')?.value || '',
      condition: document.getElementById('condition')?.value || 'new',
      city: document.getElementById('city')?.value || 'תל אביב',
      // שואב את התמונות שהועלו מ-Cloudinary או תמונת ברירת מחדל
      images: window.uploadedImageUrls && window.uploadedImageUrls.length > 0 
        ? window.uploadedImageUrls 
        : ['https://picsum.photos/600']
    };

    try {
      // 3. שליחת הבקשה לשרת עם הטוקן ב-Headers
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'שגיאה ביצירת המוצר');
      }

      const newProduct = await res.json();
      alert('המוצר פורסם בהצלחה!');
      
      // 4. מעבר לדף החנות לצפייה במוצר
      window.location.href = '/index.html';

    } catch (err) {
      console.error('Error creating product:', err);
      alert(`שגיאה בפרסום המוצר: ${err.message}`);
    }
  });
});