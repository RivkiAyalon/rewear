async function loadMyProducts() {
  const container = document.getElementById('my-products-container');
  if (!container) return;

  try {
    // שליחת בקשה לשרת עם אסימון אימות (אם מחוברים)
    const token = localStorage.getItem('token');
    let res = await fetch('/api/products/my', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    // ניסיון גיבוי לראוט חלופי במידה והשרת מחזיר 404
    if (!res.ok && res.status === 404) {
      res = await fetch('/api/products/my-products', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
    }

    // אם עדיין אין תשובה תקינה מהשרת
    if (!res.ok) {
      container.innerHTML = '<p class="muted">You haven\'t listed any products yet.</p>';
      return;
    }

    const products = await res.json();

    // ניקוי האזור לפני הזרקת הנתונים
    container.innerHTML = '';

    // בדיקה אם אין מוצרים ברשימה
    if (!products || !Array.isArray(products) || products.length === 0) {
      container.innerHTML = '<p class="muted">You haven\'t listed any products yet.</p>';
      return;
    }

    // אם יש מוצרים - מציגים אותם
    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card field';
      
      const soldTag = product.status === 'sold' ? `<span class="sold-tag">נמכר!</span>` : '';      
      productCard.innerHTML = `
        <h3>${product.title}</h3>
        ${soldTag}
        <p>קטגוריה: ${product.category}</p>
        <button class="btn btn-secondary" onclick="editProduct('${product._id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
      `;
      
      container.appendChild(productCard);
    });

  } catch (error) {
    console.error('Error loading products:', error);
    // טיפול בנפילה במקרה של שגיאת רשת/קוד – עדיין מציגים את ההודעה הניטרלית!
    container.innerHTML = '<p class="muted">You haven\'t listed any products yet.</p>';
  }
}

// פונקציית מחיקה עם חלונית אישור וקריאה לשרת
async function deleteProduct(productId) {
  if (confirm('האם את בטוחה שאת רוצה למחוק את המוצר?')) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (res.ok) {
        alert('המוצר נמחק בהצלחה');
        loadMyProducts(); // רענון הרשימה לאחר המחיקה
      } else {
        alert('שגיאה במחיקת המוצר');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  }
}

// קוראים לפונקציה מידית + בעת טעינת ה-DOM
loadMyProducts();
document.addEventListener('DOMContentLoaded', loadMyProducts);

// האזנה ללחיצה על הטאב "My items" כדי לטעון מחדש את המוצרים
document.querySelectorAll('.tab[data-tab="items"]').forEach(tab => {
  tab.addEventListener('click', loadMyProducts);
});

async function editProduct(productId) {
  try {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    const product = await res.json();

    // מעבר לטאב Sell an item
    const sellTab = document.querySelector('.tab[data-tab="sell"]');
    if (sellTab) sellTab.click();

    // מילוי הנתונים בטופס הפרסום
    document.getElementById('title').value = product.title || '';
    document.getElementById('price').value = product.price || '';
    document.getElementById('description').value = product.description || '';
    
    if (product.gender) {
      const genderSelect = document.getElementById('gender');
      genderSelect.value = product.gender;
      genderSelect.dispatchEvent(new Event('change'));
    }

    // שמירת ה-ID על הטופס לצורך עדכון (PUT)
    const form = document.getElementById('publish-form');
    if (form) {
      form.dataset.editId = productId;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Update Item';
    }

  } catch (err) {
    console.error('Error loading product for edit:', err);
    alert('שגיאה בטעינת נתוני המוצר לעריכה');
  }
}
