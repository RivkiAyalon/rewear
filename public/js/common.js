// ============ Auth helpers ============

function getToken() {
  return localStorage.getItem('rewear_token');
}

function getUser() {
  const raw = localStorage.getItem('rewear_user');
  return raw ? JSON.parse(raw) : null;
}

function saveAuth(token, user) {
  localStorage.setItem('rewear_token', token);
  localStorage.setItem('rewear_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('rewear_token');
  localStorage.removeItem('rewear_user');
  window.location.href = '/index.html';
}

// Redirects to login if not signed in. Use at the top of protected pages.
function requireAuth() {
  if (!getToken()) {
    window.location.href = '/login.html?redirect=' +
      encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

function requireAdmin() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// ============ API ============

async function api(path, options = {}) {
  const token = getToken();

  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // בעמודי ההזדהות 401 אומר "פרטים שגויים", לא "הטוקן פג"
    const isAuthCall = path.includes('/api/auth/login') ||
                       path.includes('/api/auth/register');
    if (!isAuthCall) {
      logout();
    }
    throw new Error(data.message || 'Session expired');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// ============ Formatting ============

function formatPrice(n) {
  return `₪${Number(n).toLocaleString('en-US')}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ============ Shared product card ============

function productCard(p) {
  return `
    <a href="/product.html?id=${p._id}" class="card">
      <div class="card-media">
        <img src="${p.images?.[0] || ''}" alt="${p.title}">
        ${p.status === 'sold' ? '<span class="badge badge-sold card-fav">Sold</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-brand">${p.brand || ''}</div>
        <div class="card-title">${p.title}</div>
        <div class="card-meta">${p.size} · ${p.condition}</div>
        <div class="card-price">${formatPrice(p.price)}</div>
      </div>
    </a>
  `;
}

// ============ Toast messages ============

function showToast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ============ Query string ============

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ============ Layout ============

function renderNavbar() {
  const user = getUser();
  const el = document.getElementById('navbar');
  if (!el) return;

  const guestLinks = `
    <a href="/login.html" class="nav-link">Sign in</a>
    <a href="/login.html?tab=register" class="btn btn-primary btn-sm">Join</a>
  `;

  const userLinks = `
    <a href="/profile.html?tab=favorites" class="nav-link">Favorites</a>
    <a href="/profile.html?tab=sell" class="btn btn-primary btn-sm">Sell an item</a>
    <div class="nav-user">
      <button class="nav-avatar" id="userMenuBtn">${user?.name?.[0] ?? '?'}</button>
      <div class="nav-dropdown" id="userMenu">
        <div class="nav-dropdown-head">
          <strong>${user?.name ?? ''}</strong>
          <span>${user?.points ?? 0} points</span>
        </div>
        <a href="/profile.html">My profile</a>
        <a href="/profile.html?tab=items">My items</a>
        <a href="/profile.html?tab=orders">My orders</a>
        ${user?.role === 'admin' ? '<a href="/admin.html">Admin</a>' : ''}
        <button id="logoutBtn">Sign out</button>
      </div>
    </div>
  `;

  el.innerHTML = `
    <nav class="nav">
      <a href="/index.html" class="nav-logo">ReWear</a>
      <div class="nav-center">
        <a href="/shop.html?gender=women" class="nav-link">Women</a>
        <a href="/shop.html?gender=men" class="nav-link">Men</a>
        <a href="/shop.html?gender=kids" class="nav-link">Kids</a>
        <a href="/how-it-works.html" class="nav-link">How it works</a>
      </div>
      <div class="nav-right">
        ${user ? userLinks : guestLinks}
      </div>
    </nav>
  `;

  const btn = document.getElementById('userMenuBtn');
  if (btn) {
    btn.onclick = e => {
      e.stopPropagation();
      document.getElementById('userMenu').classList.toggle('open');
    };
    document.onclick = () =>
      document.getElementById('userMenu')?.classList.remove('open');
    document.getElementById('logoutBtn').onclick = logout;
  }
}

function renderFooter() {
  const el = document.getElementById('footer');
  if (!el) return;

  el.innerHTML = `
    <footer class="footer">
      <div class="footer-inner">
        <div>
          <div class="footer-logo">ReWear</div>
          <p>Give clothes a second life.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <a href="/shop.html?gender=women">Women</a>
          <a href="/shop.html?gender=men">Men</a>
          <a href="/shop.html?gender=kids">Kids</a>
        </div>
        <div>
          <h4>About</h4>
          <a href="/how-it-works.html">How it works</a>
          <a href="/about.html">About us</a>
          <a href="/contact.html">Contact</a>
        </div>
      </div>
      <div class="footer-bottom">© 2026 ReWear · Student project</div>
    </footer>
  `;
}

// Runs on every page
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
});