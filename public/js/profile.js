// עמוד מוגן — מי שלא מחוברת מועברת להתחברות
if (!requireAuth()) throw new Error('not authenticated');


// ============================================
// טאבים
// ============================================

function switchProfileTab(tab) {
  document.querySelectorAll('.tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-panel').forEach(panel =>
    panel.classList.toggle('hidden', panel.id !== `tab-${tab}`)
  );
  history.replaceState(null, '', `?tab=${tab}`);

  // טוענים את התוכן רק כשנכנסים לטאב
  if (tab === 'points')    loadPoints();
  if (tab === 'items')     loadMyProducts();
  if (tab === 'favorites') loadFavorites();
  if (tab === 'orders')    { loadMyOrders(); loadMySales(); }
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.onclick = () => switchProfileTab(btn.dataset.tab);
});

// פותחים את הטאב לפי הכתובת — ה-navbar מפנה ל-?tab=sell וכו'
switchProfileTab(getParam('tab') || 'details');


// ============================================
// טעינת פרטי המשתמשת
// ============================================

async function loadProfile() {
  try {
    // מביאים מהשרת ולא מ-localStorage, כדי שהנקודות יהיו מעודכנות
    const user = await api('/api/auth/me');
    localStorage.setItem('rewear_user', JSON.stringify(user));

    document.getElementById('profileName').textContent   = user.name;
    document.getElementById('profileMeta').textContent   = `${user.city || ''} · ${user.email}`;
    document.getElementById('profileAvatar').textContent = user.name[0];
    document.getElementById('profilePoints').textContent = user.points;

    document.getElementById('detName').value  = user.name;
    document.getElementById('detEmail').value = user.email;
    document.getElementById('detPhone').value = user.phone || '';

        // עכשיו זה input רגיל עם datalist, אז פשוט מציבים
    document.getElementById('detCity').value = user.city || '';

  } catch (err) {
    showToast(err.message, 'error');
  }
}


// ============================================
// שמירת פרטים
// ============================================

const saveBtn = document.getElementById('saveDetails');

saveBtn.onclick = async () => {
  const errEl = document.getElementById('detError');
  errEl.classList.add('hidden');

  const name  = document.getElementById('detName').value.trim();
  const city  = document.getElementById('detCity').value.trim();
  const phone = document.getElementById('detPhone').value.trim();

  if (!name || !city || !phone) {
    errEl.textContent = 'Please fill in all fields';
    errEl.classList.remove('hidden');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const user = await api('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ name, city, phone })
    });

    localStorage.setItem('rewear_user', JSON.stringify(user));
    showToast('Your details were saved', 'success');
    renderNavbar();       // מרענן את השם והאות בתפריט
    loadProfile();

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    // finally רץ תמיד — המשתמשת נשארת בעמוד,
    // אז הכפתור חייב לחזור לפעולה בשני המקרים
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save changes';
  }
};


// ============================================
// נקודות
// ============================================

async function loadPoints() {
  const box = document.getElementById('ptsHistory');

  try {
    const data = await api('/api/auth/points');

    document.getElementById('ptsBalance').textContent = data.balance;
    document.getElementById('ptsEarned').textContent  = `+${data.earned}`;
    document.getElementById('ptsSpent').textContent   = `−${data.spent}`;

    if (!data.history.length) {
      box.innerHTML = `<div class="empty">
        <h3>No activity yet</h3>
        <p>Sell your first item to start earning points.</p>
      </div>`;
      return;
    }

    box.innerHTML = `<div class="panel">${data.history.map(h => `
      <div class="pts-row">
        <div>
          <strong>${escapeHtml(h.title)}</strong>
          <div class="small muted">${h.type === 'earned' ? 'Sold' : 'Bought with points'}
            · ${formatDate(h.date)}</div>
        </div>
        <div class="pts-amount ${h.type}">
          ${h.type === 'earned' ? '+' : '−'}${h.amount}
        </div>
      </div>
    `).join('')}</div>`;

  } catch (err) {
    box.innerHTML = `<div class="empty"><h3>Could not load activity</h3></div>`;
  }
}


// ============================================
// מועדפים
// ============================================

async function loadFavorites() {
  const box = document.getElementById('favorites');
  if (!box) return;

  box.innerHTML = '<div class="spinner"></div>';

  try {
    const products = await api('/api/favorites');
    const usdRate = await getUsdRate();

    if (!products.length) {
      box.innerHTML = `<div class="empty">
        <h3>No favorites yet</h3>
        <p>Tap the heart on any item to save it here.</p>
      </div>`;
      return;
    }

    box.innerHTML = `
      <div class="grid">
        ${products.map(p => `
          <div class="card">
            <a href="/product.html?id=${p._id}">
              <div class="card-media">
                <img src="${p.images?.[0] || ''}" alt="${escapeHtml(p.title)}">
                ${p.status === 'sold'
                  ? '<span class="badge badge-sold card-fav">Sold</span>' : ''}
              </div>
            </a>
            <div class="card-body">
              <div class="card-brand">${escapeHtml(p.brand)}</div>
              <div class="card-title">${escapeHtml(p.title)}</div>
              <div class="card-meta">${p.size} · ${p.condition}</div>
              <div class="card-price">
                ${formatPrice(p.price)}
                <span class="muted">≈ $${Math.round(p.price * usdRate)}</span>
            </div>
              

              <div class="flex gap-sm mt">
                ${p.status === 'sold' ? '' : `
                  <a class="btn btn-primary btn-sm"
                     href="/checkout.html?id=${p._id}">Buy now</a>
                `}
                <button class="btn btn-ghost btn-sm danger-link"
                        onclick="removeFavorite('${p._id}')">Remove</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (err) {
    box.innerHTML = `<div class="empty"><h3>${err.message}</h3></div>`;
  }
}

async function removeFavorite(productId) {
  try {
    await api(`/api/favorites/${productId}`, { method: 'DELETE' });
    showToast('Removed from favorites', 'success');
    loadFavorites();
  } catch (err) {
    showToast(err.message, 'error');
  }
}


// ============================================
// ההזמנות שלי
// ============================================
// אין כאן כפתור ביטול בכוונה:
// קונה שקיבלה את הפריט פיזית הייתה יכולה לבטל
// ולהשאיר את המוכרת בלי הפריט ובלי התמורה.
// ביטול עובר דרך המנהלת, שרואה את שני הצדדים.

async function loadMyOrders() {
  const box = document.getElementById('myOrders');
  if (!box) return;

  box.innerHTML = '<div class="spinner"></div>';

  try {
    const orders = await api('/api/orders/my');

    if (!orders.length) {
      box.innerHTML = '<p class="muted">No orders yet.</p>';
      return;
    }

    box.innerHTML = orders.map(o => `
      <div class="order-row">
        <img src="${o.productId?.images?.[0] || ''}" alt="">
        <div class="order-info">
          <strong>${escapeHtml(o.productId?.title) || 'Item'}</strong>
          <div class="small muted">
            ${formatPrice(o.price)} · paid with ${o.paymentMethod}
            · ${formatDate(o.createdAt)}
          </div>
          <div class="small muted">
            Seller: ${escapeHtml(o.sellerId?.name) || '—'}
          </div>
        </div>
        <div>
          <span class="badge ${o.status === 'cancelled' ? 'badge-cancel' : ''}">
            ${o.status}
          </span>
        </div>
      </div>
    `).join('') + `
      <p class="muted small mt">
        Something wrong with an order?
        <a href="/contact.html" class="contact-link">Contact us</a>
        and we'll help.
      </p>
    `;

  } catch (err) {
    box.innerHTML = `<p class="field-error">${err.message}</p>`;
  }
}


// ============================================
// המכירות שלי
// ============================================

async function loadMySales() {
  const box = document.getElementById('mySales');
  if (!box) return;

  box.innerHTML = '<div class="spinner"></div>';

  try {
    const sales = await api('/api/orders/sales');

    if (!sales.length) {
      box.innerHTML = '<p class="muted">No sales yet.</p>';
      return;
    }

    box.innerHTML = sales.map(o => `
      <div class="order-row">
        <img src="${o.productId?.images?.[0] || ''}" alt="">
        <div class="order-info">
          <strong>${escapeHtml(o.productId?.title) || 'Item'}</strong>
          <div class="small muted">
            ${formatPrice(o.price)} · ${formatDate(o.createdAt)}
          </div>
          <div class="small muted">
            Buyer: ${escapeHtml(o.buyerId?.name) || '—'}
          </div>
        </div>
        <div>
          <span class="pts-amount earned">+${o.pointsEarned}</span>
          <div class="small muted">points</div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    box.innerHTML = `<p class="field-error">${err.message}</p>`;
  }
}


loadProfile();