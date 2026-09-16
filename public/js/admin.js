// עמוד מנהלת בלבד
if (!requireAdmin()) throw new Error('not admin');

// ===== טאבים =====

const loaded = {};   // כל טאב נטען פעם אחת בלבד

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-panel').forEach(panel =>
    panel.classList.toggle('hidden', panel.id !== `tab-${tab}`)
  );
  history.replaceState(null, '', `?tab=${tab}`);

  if (loaded[tab]) return;
  loaded[tab] = true;

  if (tab === 'overview') loadOverview();
  if (tab === 'users')  loadUsers();
  if (tab === 'orders') loadOrders();
    if (tab === 'products') loadProducts();
    if (tab === 'messages') loadMessages();

}

document.querySelectorAll('.tab').forEach(btn => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

switchTab(getParam('tab') || 'overview');

// ===== רבקי — ניהול משתמשות =====

async function loadUsers() {
  const box = document.getElementById('usersTable');

  try {
    const users = await api('/api/admin/users');
    const me = getUser();

    box.innerHTML = `
      <div class="panel" style="overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>City</th>
              <th>Points</th><th>Items</th><th>Orders</th>
              <th>Role</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td class="small muted">${u.email}</td>
                <td class="small">${u.city || '—'}</td>
                <td>${u.points}</td>
                <td>${u.products}</td>
                <td>${u.orders}</td>
                <td>
                  <span class="badge ${u.role === 'admin' ? 'badge-new' : ''}">
                    ${u.role}
                  </span>
                </td>
                <td class="row-actions">
                  ${u._id === me._id ? '<span class="small muted">You</span>' : `
                    <button class="btn btn-ghost btn-sm"
                            onclick="toggleRole('${u._id}', '${u.role}')">
                      Make ${u.role === 'admin' ? 'user' : 'admin'}
                    </button>
                    <button class="btn btn-ghost btn-sm danger-link"
                            onclick="removeUser('${u._id}', '${u.name}')">
                      Delete
                    </button>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } catch (err) {
    box.innerHTML = `<div class="empty"><h3>Could not load users</h3></div>`;
  }
}

async function toggleRole(id, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';

  try {
    await api(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    showToast(`Role changed to ${newRole}`, 'success');
    loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeUser(id, name) {
  if (!confirm(`Delete ${name}? This will also remove their available items.`)) return;

  try {
    await api(`/api/admin/users/${id}`, { method: 'DELETE' });
    showToast('User deleted', 'success');
    loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}


// ===== רבקי — טבלת הזמנות עם פרטי קשר =====

const PAYMENT_LABEL = { card: 'Card', points: 'Points' };

function contactCell(person, role) {
  if (!person) return '<span class="muted">Deleted user</span>';

  return `
    <div class="contact-cell">
      <strong>${person.name}</strong>
      <a href="mailto:${person.email}" class="contact-link">${person.email}</a>
      <a href="tel:${person.phone || ''}" class="contact-link">
        ${person.phone || 'No phone'}
      </a>
      <span class="contact-city">${person.city || '—'}</span>
    </div>
  `;
}

async function loadOrders() {
  const box = document.getElementById('ordersTable');

  try {
    const orders = await api('/api/admin/orders');

    if (!orders.length) {
      box.innerHTML = '<div class="empty"><h3>No orders yet</h3></div>';
      return;
    }

    const revenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.price, 0);

    box.innerHTML = `
      <p class="muted mb">
        ${orders.length} orders · ${formatPrice(revenue)} total revenue
      </p>

      <div class="panel" style="overflow-x:auto">
        <table class="table orders-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Pickup</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td>
                  <div class="order-row-product">
                    <img src="${o.productId?.images?.[0] || ''}"
                         alt="${o.productId?.title || ''}">
                    <div>
                      <span>${o.productId?.title || 'Deleted item'}</span>
                      <div class="small muted">${formatPrice(o.price)}</div>
                    </div>
                  </div>
                </td>

                <td>${contactCell(o.buyerId)}</td>
                <td>${contactCell(o.sellerId)}</td>

                <td class="small">
                  <div><strong>From:</strong> ${o.productId?.city || '—'}</div>
                  <div><strong>To:</strong> ${o.shippingCity || '—'}</div>
                </td>

                <td>
                  <span class="badge ${o.paymentMethod === 'points'
                      ? 'badge-points' : 'badge-card'}">
                    ${PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod}${
                      o.cardLast4 ? ` ····${o.cardLast4}` : ''}
                  </span>
                </td>

                <td class="small muted">${formatDate(o.createdAt)}</td>

                <td>
                  <span class="badge ${o.status === 'cancelled'
                      ? 'badge-cancel' : ''}">${o.status}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } catch (err) {
    box.innerHTML = '<div class="empty"><h3>Could not load orders</h3></div>';
  }
}

// ===== מפתחת 5 — סטטיסטיקות וגרפים =====

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                'Jul','Aug','Sep','Oct','Nov','Dec'];

async function loadOverview() {
  await loadStats();
  await loadCharts();
}

async function loadStats() {
  const box = document.getElementById('adminStats');

  try {
    const s = await api('/api/admin/stats');

    box.innerHTML = `
      <div class="stats-row">
        <div class="panel stat-card">
          <div class="stat-label">Users</div>
          <div class="stat-value">${s.users}</div>
        </div>
        <div class="panel stat-card">
          <div class="stat-label">Active items</div>
          <div class="stat-value">${s.products}</div>
        </div>
        <div class="panel stat-card">
          <div class="stat-label">Orders</div>
          <div class="stat-value">${s.orders}</div>
        </div>
        <div class="panel stat-card">
          <div class="stat-label">Total revenue</div>
          <div class="stat-value clay">${formatPrice(s.revenue)}</div>
        </div>
      </div>
    `;
  } catch (err) {
    box.innerHTML = '<div class="empty"><h3>Could not load stats</h3></div>';
  }
}

async function loadCharts() {
  try {
    const [sales, sellers] = await Promise.all([
      api('/api/admin/sales-by-month'),
      api('/api/admin/top-sellers')
    ]);

    // גרף 1 — מכירות לפי חודש
    new Chart(document.getElementById('salesChart'), {
      type: 'bar',
      data: {
        labels: sales.map(d => `${MONTHS[d._id.month - 1]} ${d._id.year}`),
        datasets: [{
          data: sales.map(d => d.revenue),
          backgroundColor: '#24453A',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // גרף 2 — חמש המוכרות המובילות, אופקי
    new Chart(document.getElementById('sellersChart'), {
      type: 'bar',
      data: {
        labels: sellers.map(s => s.name),
        datasets: [{
          data: sellers.map(s => s.revenue),
          backgroundColor: '#C9705C',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });

  } catch (err) {
    showToast('Could not load charts', 'error');
  }
}

// ===== מפתחת 5 — ניהול מוצרים =====

let allProducts = [];

async function loadProducts() {
  const box = document.getElementById('adminProducts');

  try {
    allProducts = await api('/api/admin/products');
    renderProducts();
  } catch (err) {
    box.innerHTML = '<div class="empty"><h3>Could not load products</h3></div>';
  }
}

function renderProducts() {
  const box    = document.getElementById('adminProducts');
  const search = document.getElementById('productSearch').value.trim().toLowerCase();
  const status = document.getElementById('productStatus').value;

  // סינון בצד לקוח — הנתונים כבר כאן, אין טעם לפנות שוב לשרת
  const list = allProducts.filter(p => {
    if (status && p.status !== status) return false;
    if (!search) return true;
    return p.title.toLowerCase().includes(search) ||
           (p.brand || '').toLowerCase().includes(search);
  });

  if (!list.length) {
    box.innerHTML = '<div class="empty"><h3>No products found</h3></div>';
    return;
  }

  box.innerHTML = `
    <p class="muted mb">${list.length} of ${allProducts.length} products</p>

    <div class="panel" style="overflow-x:auto">
      <table class="table">
        <thead>
          <tr>
            <th>Item</th><th>Category</th><th>Price</th>
            <th>Seller</th><th>City</th><th>Views</th>
            <th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${list.map(p => `
            <tr>
              <td>
                <div class="order-row-product">
                  <img src="${p.images?.[0] || ''}" alt="${p.title}">
                  <div>
                    <span>${p.title}</span>
                    <div class="small muted">${p.brand || 'No brand'} · ${p.size}</div>
                  </div>
                </div>
              </td>
              <td class="small">${p.gender} · ${p.type}</td>
              <td>${formatPrice(p.price)}</td>
              <td class="small">${p.sellerId?.name || '—'}</td>
              <td class="small">${p.city || '—'}</td>
              <td class="small muted">${p.views}</td>
              <td>
                <span class="badge ${p.status === 'sold' ? 'badge-sold' : ''}">
                  ${p.status}
                </span>
              </td>
              <td class="row-actions">
                ${p.status === 'sold'
                  ? '<span class="small muted">—</span>'
                  : `<button class="btn btn-ghost btn-sm danger-link"
                       onclick="removeProduct('${p._id}', '${p.title.replace(/'/g, "\\'")}')">
                       Delete
                     </button>`}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function removeProduct(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

  try {
    await api(`/api/admin/products/${id}`, { method: 'DELETE' });
    showToast('Product deleted', 'success');
    loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.getElementById('productSearch').oninput  = renderProducts;
document.getElementById('productStatus').onchange = renderProducts;

async function loadMessages() {
  const box = document.getElementById('adminMessages');

  try {
    const messages = await api('/api/messages');

    if (!messages.length) {
      box.innerHTML = '<div class="empty"><h3>No messages yet</h3></div>';
      return;
    }

    box.innerHTML = `
      <div class="panel" style="overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${messages.map(message => `
              <tr>
                <td><strong>${message.name}</strong></td>
                <td class="small muted">${message.email}</td>
                <td>${message.subject || '—'}</td>
                <td>${message.body}</td>
                <td class="small muted">${formatDate(message.createdAt)}</td>
                <td>
                  ${message.isRead
                    ? '<span class="badge">Read</span>'
                    : `<button class="btn btn-ghost btn-sm"
                         onclick="markMessageRead('${message._id}')">
                         Mark as read
                       </button>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    box.innerHTML = '<div class="empty"><h3>Could not load messages</h3></div>';
  }
}


// מסמן הודעה מסוימת כנקראה ומרענן את רשימת ההודעות.
async function markMessageRead(id) {
  try {
    // שולחים בקשת PUT לשרת כדי לעדכן את ההודעה.
    await api(`/api/messages/${id}/read`, {
      method: 'PUT'
    });

    // מציגים הודעה למנהלת שהפעולה הצליחה.
    showToast('Message marked as read', 'success');

    // טוענים מחדש את רשימת ההודעות כדי להציג את הסטטוס החדש.
    loadMessages();
  } catch (err) {
    // מציגים הודעת שגיאה אם העדכון נכשל.
    showToast(err.message, 'error');
  }
}

