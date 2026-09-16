async function api(url, options = {}) {
  const token = localStorage.getItem('rewear_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}


// =========================
// My Orders
// =========================

async function loadMyOrders() {
  const container = document.getElementById('myOrders');

  try {
    const orders = await api('/api/orders/my');

    container.innerHTML = '';

    if (orders.length === 0) {
      container.textContent = 'No orders yet.';
      return;
    }

    orders.forEach(order => {
      const product = order.productId;

      const div = document.createElement('div');

      div.innerHTML = `
        <h3>${product?.title || 'Product'}</h3>
        <p>Price: ${order.price} ₪</p>
        <p>Payment: ${order.paymentMethod}</p>
        <p>Status: ${order.status}</p>
        <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        ${
          order.status === 'completed'
            ? `<button onclick="cancelOrder('${order._id}')">
                 Cancel order
               </button>`
            : ''
        }
        <hr>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    container.textContent = err.message;
  }
}


// =========================
// My Sales
// =========================

async function loadMySales() {
  const container = document.getElementById('mySales');

  try {
    const sales = await api('/api/orders/sales');

    container.innerHTML = '';

    if (sales.length === 0) {
      container.textContent = 'No sales yet.';
      return;
    }

    sales.forEach(order => {
      const product = order.productId;

      const div = document.createElement('div');

      div.innerHTML = `
        <h3>${product?.title || 'Product'}</h3>
        <p>Price: ${order.price} ₪</p>
        <p>Points received: ${order.pointsEarned}</p>
        <p>Status: ${order.status}</p>
        <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        <hr>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    container.textContent = err.message;
  }
}


// =========================
// Favorites
// =========================

async function loadFavorites() {
  const container = document.getElementById('favorites');

  try {
    const products = await api('/api/favorites');

    container.innerHTML = '';

    if (products.length === 0) {
      container.textContent = 'No favorites yet.';
      return;
    }

    products.forEach(product => {

      const div = document.createElement('div');

      div.innerHTML = `
        <h3>${product.title}</h3>
        <p>${product.price} ₪</p>
        <p>Status: ${product.status}</p>
        <hr>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    container.textContent = err.message;
  }
}


// =========================
// Cancel order
// =========================

async function cancelOrder(orderId) {

  const confirmed = confirm(
    'Are you sure you want to cancel this order?'
  );

  if (!confirmed) {
    return;
  }

  try {

    await api(`/api/orders/${orderId}`, {
      method: 'DELETE'
    });

    alert('Order cancelled successfully');

    await loadMyOrders();

  } catch (err) {

    alert(err.message);

  }
}


// =========================
// Start
// =========================

async function initProfile() {
  await loadMyOrders();
  await loadMySales();
  await loadFavorites();
}

initProfile();
// =========================
// Developer 4 - Orders & Favorites
// =========================

async function profileApi(url, options = {}) {
  ///const token = localStorage.getItem('rewear_token');
const token = (localStorage.getItem('rewear_token') || localStorage.getItem('token') || '').trim();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}


// =========================
// My Orders
// =========================

async function loadMyOrders() {

  const container = document.getElementById('myOrders');

  if (!container) return;

  try {

    const orders = await profileApi('/api/orders/my');

    container.innerHTML = '';

    if (orders.length === 0) {
      container.innerHTML = '<p class="muted">No orders yet.</p>';
      return;
    }

    orders.forEach(order => {

      const product = order.productId;

      const div = document.createElement('div');

      div.className = 'panel';

      div.innerHTML = `
        <h3>${product?.title || 'Product'}</h3>

        <p>Price: ${order.price} ₪</p>

        <p>Payment method: ${order.paymentMethod}</p>

        <p>Status: ${order.status}</p>

        <p>
          Date:
          ${new Date(order.createdAt).toLocaleDateString()}
        </p>

        ${
          order.status === 'completed'
            ? `
              <button
                class="btn btn-primary"
                onclick="cancelMyOrder('${order._id}')">
                Cancel order
              </button>
            `
            : ''
        }
      `;

      container.appendChild(div);

    });

  } catch (err) {

    container.innerHTML =
      `<p class="field-error">${err.message}</p>`;

  }
}


// =========================
// My Sales
// =========================

async function loadMySales() {

  const container = document.getElementById('mySales');

  if (!container) return;

  try {

    const sales = await profileApi('/api/orders/sales');

    container.innerHTML = '';

    if (sales.length === 0) {
      container.innerHTML = '<p class="muted">No sales yet.</p>';
      return;
    }

    sales.forEach(order => {

      const product = order.productId;

      const div = document.createElement('div');

      div.className = 'panel';

      div.innerHTML = `
        <h3>${product?.title || 'Product'}</h3>

        <p>Price: ${order.price} ₪</p>

        <p>Points received: ${order.pointsEarned}</p>

        <p>Status: ${order.status}</p>

        <p>
          Date:
          ${new Date(order.createdAt).toLocaleDateString()}
        </p>
      `;

      container.appendChild(div);

    });

  } catch (err) {

    container.innerHTML =
      `<p class="field-error">${err.message}</p>`;

  }
}


// =========================
// Favorites
// =========================

async function loadProfileFavorites() {

  const container = document.getElementById('favorites');

  if (!container) return;

  try {

    const products = await profileApi('/api/favorites');

    container.innerHTML = '';

    if (products.length === 0) {
      container.innerHTML =
        '<p class="muted">No favorites yet.</p>';
      return;
    }

    products.forEach(product => {

      const div = document.createElement('div');

      div.className = 'panel';

      div.innerHTML = `
        <h3>${product.title}</h3>

        <p>Price: ${product.price} ₪</p>

        <p>Status: ${product.status}</p>
      `;

      container.appendChild(div);

    });

  } catch (err) {

    container.innerHTML =
      `<p class="field-error">${err.message}</p>`;

  }
}


// =========================
// Cancel order
// =========================

async function cancelMyOrder(orderId) {

  const confirmed = confirm(
    'Are you sure you want to cancel this order?'
  );

  if (!confirmed) return;

  try {

    await profileApi(`/api/orders/${orderId}`, {
      method: 'DELETE'
    });

    alert('Order cancelled successfully');

    await loadMyOrders();

  } catch (err) {

    alert(err.message);

  }
}


// =========================
// Load Developer 4 data
// =========================

loadMyOrders();
loadMySales();
loadProfileFavorites();


// =========================
// Tab Switching System
// =========================
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 1. הסרת active מכל הטאבים
      tabs.forEach(t => t.classList.remove('active'));
      // 2. הוספת active לטאב שנלחץ
      tab.classList.add('active');

      // 3. הסתרת כל הפאנלים
      panels.forEach(p => p.classList.add('hidden'));

      // 4. הצגת הפאנל המתאים
      const targetTab = tab.getAttribute('data-tab');
      const targetPanel = document.getElementById(`tab-${targetTab}`);
      if (targetPanel) {
        targetPanel.classList.remove('hidden');
      }
    });
  });
});