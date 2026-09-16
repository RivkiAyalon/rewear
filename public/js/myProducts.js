// ============================================
// "המוצרים שלי" — טאב בפרופיל
// ============================================

async function loadMyProducts() {
  const container = document.getElementById('my-products-container');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  try {
    // api() מ-common.js מוסיפה לבד את הטוקן ואת הכותרות
    const products = await api('/api/products/my');

    if (!products.length) {
      container.innerHTML = `
        <div class="empty">
          <h3>No items yet</h3>
          <p>Publish your first item to start selling.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid">
        ${products.map(p => `
          <div class="card">
            <div class="card-media">
              <img src="${p.images?.[0] || ''}" alt="${p.title}">
              ${p.status === 'sold'
                ? '<span class="badge badge-sold card-fav">Sold</span>'
                : ''}
            </div>
            <div class="card-body">
              <div class="card-brand">${p.brand || ''}</div>
              <div class="card-title">${p.title}</div>
              <div class="card-meta">${p.size} · ${p.condition}</div>
              <div class="card-price">${formatPrice(p.price)}</div>

              <div class="flex gap-sm mt">
                ${p.status === 'sold' ? '' : `
                  <button class="btn btn-outline btn-sm"
                          onclick="editProduct('${p._id}')">Edit</button>
                  <button class="btn btn-ghost btn-sm danger-link"
                          onclick="removeMyProduct('${p._id}')">Delete</button>
                `}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="empty"><h3>${err.message}</h3></div>`;
  }
}


// ============================================
// מחיקת מוצר
// ============================================
// שם הפונקציה שונה מ-deleteProduct כדי לא להתנגש
// עם שמות אחרים בעמוד
async function removeMyProduct(productId) {
  if (!confirm('Delete this item? This cannot be undone.')) return;

  try {
    await api(`/api/products/${productId}`, { method: 'DELETE' });
    showToast('Item deleted', 'success');
    loadMyProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}


// ============================================
// עריכת מוצר — טוען את הנתונים לטופס הפרסום
// ============================================
async function editProduct(productId) {
  try {
    const product = await api(`/api/products/${productId}`);

    // מעבר לטאב של הטופס
    document.querySelector('.tab[data-tab="sell"]')?.click();

    // מילוי השדות הפשוטים
    document.getElementById('title').value       = product.title || '';
    document.getElementById('price').value       = product.price || '';
    document.getElementById('description').value = product.description || '';

    const brandInput = document.getElementById('brand');
    if (brandInput) brandInput.value = product.brand || '';

    const colorInput = document.getElementById('color');
    if (colorInput) colorInput.value = product.color || '';

    // השדות המקושרים — חייבים למלא בסדר,
    // וכל אחד מפעיל change שממלא את הבא אחריו
    const genderSelect   = document.getElementById('gender');
    const categorySelect = document.getElementById('category');

    if (product.gender) {
      genderSelect.value = product.gender;
      genderSelect.dispatchEvent(new Event('change'));
    }
    if (product.category) {
      categorySelect.value = product.category;
      categorySelect.dispatchEvent(new Event('change'));
    }
    // type ו-size התמלאו עכשיו, אז אפשר לבחור בהם
    if (product.type)      document.getElementById('type').value = product.type;
    if (product.size)      document.getElementById('size').value = product.size;
    if (product.condition) document.getElementById('condition').value = product.condition;
    if (product.city)      document.getElementById('city').value = product.city;

    // התמונות הקיימות — כדי שלא יימחקו אם לא מעלים חדשות
    window.uploadedImageUrls = product.images || [];
    const preview = document.getElementById('image-preview');
    if (preview) {
      preview.innerHTML = (product.images || [])
        .map(url => `<img src="${url}" class="upload-thumb">`)
        .join('');
    }

    // שומרים את ה-ID על הטופס — products.js יבדוק אותו
    // ויחליט אם זו יצירה (POST) או עדכון (PUT)
    const form = document.getElementById('publish-form');
    form.dataset.editId = productId;
    form.querySelector('button[type="submit"]').textContent = 'Update item';

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    showToast(err.message, 'error');
  }
}


