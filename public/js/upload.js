const imageInput = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
let uploadedImageUrls = [];

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