// ============================================
// admin.js — לוח הבקרה של המנהלת
// ============================================
// חמישה טאבים. שניים שלי (משתמשות, הזמנות)
// ושלושה של מפתחת 5 (סקירה, מוצרים, הודעות).
// ============================================

// ⭐ זו הסתרה, לא אבטחה!
// requireAdmin רק בודקת מה כתוב ב-localStorage.
// אפשר לערוך אותו ידנית ולהיכנס לעמוד — אבל
// אז כל הטבלאות יישארו ריקות, כי כל קריאת API
// תחזיר 403 מ-isAdmin בשרת.
// ההגנה האמיתית: router.use(auth, isAdmin)
// עמוד מנהלת בלבד
if (!requireAdmin()) throw new Error('not admin');

// ===== טאבים =====

// ⭐ ההבדל מהפרופיל: שם כל כניסה לטאב טוענת
// מחדש, כאן רק פעם אחת. הסיבה — הדשבורד כבד
// (טבלאות גדולות, Chart.js), ואין טעם לטעון
// שוב בכל מעבר. הרענון קורה אחרי פעולה
// (loadUsers אחרי מחיקה), לא אחרי מעבר טאב.
const loaded = {};   // כל טאב נטען פעם אחת בלבד

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-panel').forEach(panel =>
    panel.classList.toggle('hidden', panel.id !== `tab-${tab}`)
  );
  // replaceState — מעדכן כתובת בלי להוסיף להיסטוריה
  history.replaceState(null, '', `?tab=${tab}`);

  // ⭐ המנגנון: אם כבר נטען — יוצאים.
  // אם לא — מסמנים וטוענים.
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

// נפתח על Overview, או על מה שבכתובת
switchTab(getParam('tab') || 'overview');

// ===== רבקי — ניהול משתמשות =====

async function loadUsers() {
  const box = document.getElementById('usersTable');

  try {
    // ⭐ getUsers בשרת מחזיר גם ספירת מוצרים
    // והזמנות לכל משתמשת, דרך Promise.all.
    // החישוב שם ולא כאן — כדי לא למשוך את כל
    // המוצרים וההזמנות לדפדפן רק כדי לספור.
    const users = await api('/api/admin/users');

    // מי אני — כדי לא להציג לעצמי כפתורי מחיקה
    const me = getUser();

    box.innerHTML = `
      <div class="panel" style="overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>City</th>
              <th>Points</th><th>Items</th><th>Orders</th>
              <th>Role</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td class="small muted">${u.email}</td>
                <td class="small">${u.phone || '—'}</td>
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

// ============================================
// הערות לטבלת המשתמשות
// ============================================
// overflow-x:auto — הטבלה רחבה, בטלפון
//   גוללים אותה לצדדים
//
// || '—' — עיר וטלפון לא חובה במודל
//
// badge-new — תג צבעוני למנהלת, רגיל למשתמשת
//
// ⭐⭐ u._id === me._id — הגנה כפולה:
//   כאן מסתירים את הכפתורים מהשורה שלי,
//   ובשרת changeRole ו-deleteUser בודקות
//   req.params.id === req.user.id ומחזירות 400.
//   בלי זה, מנהלת יחידה הייתה יכולה להוריד
//   את עצמה ולנעול את המערכת בלי אף מנהלת.
// ============================================

// ⭐ כפתור אחד שעושה את שני הכיוונים.
// שולח את ה-role החדש ולא "הפוך" — כך השרת
// לא צריך לדעת מה היה קודם.
//
// ⭐⭐ נקודה חשובה להגנה: השינוי לא נכנס לתוקף
// עד שהיא תתחבר מחדש! JWT הוא stateless —
// הטוקן הישן עדיין נושא role: 'user' והוא תקף
// שבעה ימים. פתרונות: רשימת טוקנים מבוטלים,
// או שליפת ה-role מהמסד בכל בקשה. שתיהן עולות
// בביצועים, ולכן לא מימשנו.
async function toggleRole(id, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';

  try {
    // PUT — מעדכנים משאב קיים
    await api(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    showToast(`Role changed to ${newRole}`, 'success');
    loadUsers();   // מרענן כדי לראות את התג החדש
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ⭐ confirm לפני כל פעולה הרסנית.
// השם בהודעה ולא רק "Are you sure?" —
// כדי שיהיה ברור את מי מוחקים.
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
// ⭐ התפקיד העסקי של הטאב הזה:
// באתר, קונה ומוכרת לא רואות את הפרטים זו של זו.
// אנחנו מחברות ביניהן. הטבלה הזו היא הכלי לכך —
// ולכן היא מציגה מייל, טלפון ועיר של שני הצדדים.

// מיפוי קוד לתווית תצוגה
const PAYMENT_LABEL = { card: 'Card', points: 'Points' };

// ⭐ פונקציה אחת לשני הצדדים, כדי לא לכתוב
// את אותו HTML פעמיים.
// mailto: ו-tel: — לחיצה פותחת מייל או חיוג,
// ועוזרת למנהלת ליצור קשר מהר.
function contactCell(person, role) {
  // ⭐ populate מחזיר null אם המשתמשת נמחקה.
  // בלי הבדיקה הזו הטבלה הייתה קורסת על
  // person.name של null.
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
    // ⭐ getOrders בשרת עושה שלושה populate:
    // productId, buyerId ו-sellerId. בלעדיהם
    // היינו מקבלים ObjectId במקום שמות ומיילים.
    const orders = await api('/api/admin/orders');

    if (!orders.length) {
      box.innerHTML = '<div class="empty"><h3>No orders yet</h3></div>';
      return;
    }

    // ⭐ סיכום הכנסות — רק completed.
    // הזמנה שבוטלה לא נספרת.
    // filter מסנן, reduce מסכם. ה-0 בסוף הוא
    // ערך ההתחלה, בלעדיו מערך ריק מתרסק.
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
              <th>Item location</th>
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

                <td class="small">${o.productId?.city || '—'}</td>

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

// ============================================
// הערות לטבלת ההזמנות
// ============================================
// ?. בכל מקום — מוצר עשוי להימחק אחרי שנקנה
//
// ⭐ o.price ולא o.productId.price:
//   המחיר נשמר בהזמנה כצילום מצב. אם המוכרת
//   תשנה מחיר מאוחר יותר, ההזמנה לא משתנה.
//
// ⭐ "Item location" — עיר המוצר, לא של אף
//   אחת מהן. משם אוספים את הפריט.
//
// ⭐⭐ cardLast4 — ארבע ספרות בלבד.
//   זו ההוכחה שמספר הכרטיס המלא לא נשמר אצלנו:
//   checkout.js עושה slice(-4) ושולח רק אותן.
//   שדה למספר מלא בכלל לא קיים במודל.
// ============================================

// ===== מפתחת 5 — סטטיסטיקות וגרפים =====

// מונגו מחזיר חודש 1-12, מערך מתחיל מ-0.
// לכן MONTHS[month - 1] למטה.
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                'Jul','Aug','Sep','Oct','Nov','Dec'];

async function loadOverview() {
  await loadStats();
  await loadCharts();
}

// ארבעת הכרטיסים. getStats בשרת מריץ
// ארבע שאילתות במקביל עם Promise.all.
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

// ⭐ שני ה-Aggregate של הפרויקט, מצוירים
// עם Chart.js. Promise.all — שתי קריאות
// במקביל ולא בזו אחר זו.
async function loadCharts() {
  try {
    const [sales, sellers] = await Promise.all([
      api('/api/admin/sales-by-month'),
      api('/api/admin/top-sellers')
    ]);

    // גרף 1 — מכירות לפי חודש
    // month - 1 כי מונגו סופר מ-1 והמערך מ-0
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

    // גרף 2 — חמש המוכרות המובילות, אופקי.
    // indexAxis: 'y' הופך את הגרף לאופקי,
    // כדי ששמות ארוכים ייקראו
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

// ⭐ מחזיקים את כל המוצרים בזיכרון, כדי לסנן
// בצד לקוח. שונה מהחנות, שם הסינון בשרת —
// כי שם יש דפדוף ואי אפשר למשוך הכול.
let allProducts = [];

async function loadProducts() {
  const box = document.getElementById('adminProducts');

  try {
    // ⭐ /api/admin/products ולא /api/products:
    // הנתיב הציבורי מחזיר רק available,
    // המנהלת צריכה לראות גם את מה שנמכר
    allProducts = await api('/api/admin/products');
    renderProducts();
  } catch (err) {
    box.innerHTML = '<div class="empty"><h3>Could not load products</h3></div>';
  }
}

// מרנדר מחדש בכל הקלדה — בלי קריאת רשת
function renderProducts() {
  const box    = document.getElementById('adminProducts');
  const search = document.getElementById('productSearch').value.trim().toLowerCase();
  const status = document.getElementById('productStatus').value;

  // סינון בצד לקוח — הנתונים כבר כאן, אין טעם לפנות שוב לשרת
  const list = allProducts.filter(p => {
    if (status && p.status !== status) return false;
    if (!search) return true;
    // toLowerCase בשני הצדדים — חיפוש ללא תלות ברישיות
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

// ============================================
// הערות לטבלת המוצרים
// ============================================
// ⭐ p.status === 'sold' — מוצר שנמכר לא נמחק,
//   כי יש הזמנה שמצביעה עליו. הכפתור מוסתר
//   כאן והשרת חוסם ב-400.
//
// ⭐ p.title.replace(/'/g, "\\'") — בריחה מגרש.
//   שם מוצר כמו "Levi's Jacket" היה שובר את
//   ה-onclick, כי הגרש סוגר את המחרוזת מוקדם.
// ============================================

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

// oninput — מסנן תוך כדי הקלדה
document.getElementById('productSearch').oninput  = renderProducts;
document.getElementById('productStatus').onchange = renderProducts;

// ===== מפתחת 5 — הודעות =====
// ⭐ הנקודה החזקה כאן: התוכן מגיע מאורחת
// אנונימית — הקלט הכי לא-מהימן במערכת.
// בלי escapeHtml, הודעה שמכילה
// <img src=x onerror="..."> הייתה רצה
// בדפדפן של המנהלת. זו מתקפת XSS מאוחסנת.

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
                <td><strong>${escapeHtml(message.name)}</strong></td>
                <td class="small muted">${escapeHtml(message.email)}</td>
                <td>${escapeHtml(message.subject) || '—'}</td>
                <td class="msg-body">${escapeHtml(message.body)}</td>
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