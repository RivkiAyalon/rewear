// טוענת מוצר לפי הID שנמצא בURL ומציגה את עמוד המוצר
async function loadProduct() {
  const box = document.getElementById('product');
  const id = getParam('id');

  if (!id) {
    box.innerHTML = `
      <div class="empty">
        <h3>Product not found</h3>
      </div>
    `;
    return;
  }

  try {
    // מביא מהשרת את המוצר לפי ה-ID
    const product = await api(`/api/products/${id}`);
    // ממיר את המחיר משקלים לדולרים
    const usdPrice = await priceInUsd(product.price);
    // בונה ומציג את עמוד המוצר
    box.innerHTML = `
      <div class="product-page">

        <div class="product-gallery">
          <img
            id="mainImage"
            src="${product.images?.[0] || ''}"
            alt="${product.title}"
          >

          <div class="product-thumbs">
            ${(product.images || []).map(img => `
              <img
                src="${img}"
                alt="${product.title}"
                class="product-thumb"
              >
            `).join('')}
          </div>
        </div>

        <div class="product-info">

          ${product.status === 'sold'
            ? '<span class="badge badge-sold">Sold</span>'
            : ''
          }

          <div class="card-brand">${product.brand || ''}</div>

          <h1>${product.title}</h1>

          <div class="card-price">
            ${formatPrice(product.price)}
            <span class="muted">≈ $${usdPrice}</span>
        </div>

          <p><strong>Size:</strong> ${product.size || '-'}</p>

          <p><strong>Condition:</strong> ${product.condition || '-'}</p>

          <p><strong>Color:</strong> ${product.color || '-'}</p>

          <p>
            <strong>Description:</strong><br>
            ${product.description || 'No description'}
          </p>

          <div class="panel">
            <h3>Seller</h3>
            <p>${product.sellerId?.name || ''}</p>
           <p class="muted">Pickup from ${product.city || '—'}</p>          
           </div>

          <div class="flex gap mt">
            <button class="btn btn-outline" id="favoriteBtn">
              ♡ Favorite
            </button>

            <button
              class="btn btn-primary"
              id="buyBtn"
              ${product.status === 'sold' ? 'disabled' : ''}
            >
              ${product.status === 'sold' ? 'Sold' : 'Buy now'}
            </button>
          </div>

        </div>

      </div>
    `;
    // מחליף את התמונה הראשית כשלוחצים על תמונה קטנה
    document.querySelectorAll('.product-thumb').forEach(img => {
      img.onclick = () => {
        document.getElementById('mainImage').src = img.src;
      };
    });
    const favoriteBtn = document.getElementById('favoriteBtn');
    // שומר אם המוצר נמצא כרגע במועדפים
    let isFavorite = false;
// בודקת אם המוצר במועדפים ומעדכנת את הכפתור
async function refreshProductFavorite() {
  // אם המשתמשת לא מחוברת - אין מועדפים לבדוק
  if (!getToken()) {
    isFavorite = false;
    favoriteBtn.textContent = '♡ Favorite';
    return;
  }
  try {
    // מביא מהשרת את רשימת המועדפים של המשתמשת
    const favorites = await api('/api/favorites');
    // בודק אם המוצר הנוכחי קיים ברשימת המועדפים
    isFavorite = favorites.some(
      fav => fav._id === product._id
    );
    // מעדכן את טקסט הכפתור לפי מצב המועדף
    favoriteBtn.textContent = isFavorite
      ? '♥ Favorited'
      : '♡ Favorite';

  } catch (err) {
    console.log('Could not load favorites:', err.message);
  }
}
// בודקת את מצב המועדף כשהעמוד נטען
await refreshProductFavorite();
// מוסיפה או מסירה את המוצר מהמועדפים
favoriteBtn.onclick = async () => {
  // אם המשתמשת לא מחוברת - מעביר למסך התחברות
  if (!getToken()) {
    // שומר את כתובת המוצר כדי לחזור אליה אחרי התחברות
    const redirect = encodeURIComponent(
      window.location.pathname + window.location.search
    );

    window.location.href = `/login.html?redirect=${redirect}`;
    return;
  }

  try {
    // אם המוצר כבר במועדפים - מסיר אותו
    if (isFavorite) {
      await api(`/api/favorites/${product._id}`, {
        method: 'DELETE'
      });
      // מעדכן את מצב המועדף
      isFavorite = false;
      favoriteBtn.textContent = '♡ Favorite';
      showToast('Removed from favorites', 'success');

    } else {
      // אם המוצר לא במועדפים - מוסיף אותו
      await api('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({
          productId: product._id
        })
      });
      // מעדכן את מצב המועדף
      isFavorite = true;
      favoriteBtn.textContent = '♥ Favorited';
      showToast('Added to favorites', 'success');
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
};
// בודק מחדש את מצב המועדף כשחוזרים לעמוד
window.addEventListener('pageshow', () => {
  refreshProductFavorite();
});
    // מעביר את המוצר שנבחר לעמוד התשלום
    document.getElementById('buyBtn').onclick = () => {
      // מאפשר קנייה רק אם המוצר לא נמכר
      if (product.status !== 'sold') {
        window.location.href = `/checkout.html?id=${product._id}`;
      }
    };

  } catch (err) {
    console.error(err);
    box.innerHTML = `
      <div class="empty">
        <h3>Product not found</h3>
      </div>
    `;
  }
}
// מפעיל את טעינת המוצר כשנכנסים לעמוד
loadProduct();