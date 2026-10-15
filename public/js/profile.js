// ============================================
// profile.js — העמוד האישי
// ============================================
// ששה טאבים: פרטים, נקודות, המוצרים שלי,
// פרסום פריט, מועדפים, הזמנות.
//
// ⭐ הקובץ הזה לא לבד בעמוד. profile.html טוען
// גם categories.js, cities.js, upload.js,
// products.js ו-myProducts.js — וכולם משתפים
// את אותו מרחב משתנים. לכן שמות הפונקציות כאן
// חייבים להיות ייחודיים (switchProfileTab ולא
// switchTab, כדי לא להתנגש).
// ============================================

// ⭐ שורה ראשונה, לפני הכול: עמוד מוגן.
// ה-throw עוצר את שאר הקובץ — בלעדיו הקוד
// היה ממשיך לרוץ ולקרוס על אלמנטים חסרים
// בזמן שהדפדפן כבר בדרך לעמוד ההתחברות.
// עמוד מוגן — מי שלא מחוברת מועברת להתחברות
if (!requireAuth()) throw new Error('not authenticated');


// ============================================
// טאבים
// ============================================
// ⭐ כל הטאבים קיימים ב-HTML מההתחלה. המעבר
// הוא רק הוספה והסרה של class="hidden" —
// לא טעינת עמוד מחדש.

function switchProfileTab(tab) {
  // מסמנים את הכפתור הפעיל.
  // ⭐ toggle עם פרמטר שני: מוסיף אם true,
  // מסיר אם false. חוסך if/else.
  document.querySelectorAll('.tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab)
  );

  // מסתירים את כל הפאנלים חוץ מהנבחר.
  // ההתאמה לפי id: data-tab="points" → id="tab-points"
  document.querySelectorAll('.tab-panel').forEach(panel =>
    panel.classList.toggle('hidden', panel.id !== `tab-${tab}`)
  );

  // ⭐ replaceState ולא pushState: מעדכן את
  // הכתובת בלי להוסיף להיסטוריה. כך "אחורה"
  // מחזיר לעמוד הקודם ולא מדלג בין טאבים.
  // בזכות זה אפשר לשתף קישור ישיר לטאב.
  history.replaceState(null, '', `?tab=${tab}`);

  // ⭐ טעינה עצלה (lazy loading): כל טאב פונה
  // ל-API משלו. אם היינו טוענים הכול מראש —
  // חמש קריאות רשת בכניסה לעמוד, רובן מיותרות.
  // טוענים את התוכן רק כשנכנסים לטאב
  if (tab === 'points')    loadPoints();
  if (tab === 'items')     loadMyProducts();   // מ-myProducts.js
  if (tab === 'favorites') loadFavorites();
  if (tab === 'orders')    { loadMyOrders(); loadMySales(); }
  // details ו-sell לא כאן: details מתמלא
  // ב-loadProfile, ו-sell הוא טופס ריק
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.onclick = () => switchProfileTab(btn.dataset.tab);
});

// ⭐ נקרא גם בטעינת העמוד, לא רק בלחיצה.
// ככה /profile.html?tab=orders נפתח ישר על
// ההזמנות — וזה מה שמאפשר לקישורים בתפריט
// ולהפניה מ-checkout להגיע למקום הנכון.
// פותחים את הטאב לפי הכתובת — ה-navbar מפנה ל-?tab=sell וכו'
switchProfileTab(getParam('tab') || 'details');


// ============================================
// טעינת פרטי המשתמשת
// ============================================

async function loadProfile() {
  try {
    // ⭐ חשוב: מהשרת ולא מ-localStorage.
    // ה-localStorage נשמר בהתחברות ומאז הנקודות
    // השתנו — נמכר פריט, נקנה משהו. רק השרת
    // יודע את היתרה האמיתית.
    // מביאים מהשרת ולא מ-localStorage, כדי שהנקודות יהיו מעודכנות
    const user = await api('/api/auth/me');

    // מסנכרנים חזרה, כדי שהתפריט יציג את המספר הנכון
    localStorage.setItem('rewear_user', JSON.stringify(user));

    // ===== הכותרת למעלה =====
    // ⭐ textContent ולא innerHTML — אלה נתונים
    // שהמשתמשת הקלידה, וכך אין סיכון XSS בלי
    // צורך ב-escapeHtml
    document.getElementById('profileName').textContent   = user.name;
    document.getElementById('profileMeta').textContent   = `${user.city || ''} · ${user.email}`;
    document.getElementById('profileAvatar').textContent = user.name[0];   // אות ראשונה כאווטאר
    document.getElementById('profilePoints').textContent = user.points;

    // ===== מילוי טופס הפרטים =====
    document.getElementById('detName').value  = user.name;
    document.getElementById('detEmail').value = user.email;   // disabled ב-HTML
    document.getElementById('detPhone').value = user.phone || '';

    // ⭐ העיר הייתה select עם 1500 אפשרויות, והייתה
    // בעיית תזמון: הערך הוצב לפני שהרשימה נטענה.
    // המעבר ל-input עם datalist פתר את זה —
    // input לא תלוי ברשימה כדי להחזיק ערך.
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
  errEl.classList.add('hidden');   // מנקים שגיאה קודמת

  // trim — "רבקי " ו-"רבקי" צריכים להיות אותו דבר
  const name  = document.getElementById('detName').value.trim();
  const city  = document.getElementById('detCity').value.trim();
  const phone = document.getElementById('detPhone').value.trim();

  if (!name || !city || !phone) {
    errEl.textContent = 'Please fill in all fields';
    errEl.classList.remove('hidden');
    return;
  }

  // ⭐ נועלים את הכפתור — בלי זה לחיצה כפולה
  // מהירה שולחת שתי בקשות
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    // ⭐⭐ שולחים שלושה שדות בלבד.
    // גם אם נשלח כאן { points: 99999 }, השרת
    // יתעלם: updateMe מפרק רק name, city, phone.
    // ההגנה היא בשרת — זה פשוט תואם לה.
    const user = await api('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ name, city, phone })
    });

    localStorage.setItem('rewear_user', JSON.stringify(user));
    showToast('Your details were saved', 'success');
    renderNavbar();       // מרענן את השם והאות בתפריט
    loadProfile();        // מרענן את הכותרת

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
// ⭐ קריאה אחת מחזירה הכול: יתרה, סכומים
// ורשימה מאוחדת של מכירות וקניות.
// האיחוד והמיון נעשים בשרת (getPoints),
// אז כאן רק מרנדרים לולאה אחת.

async function loadPoints() {
  const box = document.getElementById('ptsHistory');

  try {
    const data = await api('/api/auth/points');

    document.getElementById('ptsBalance').textContent = data.balance;
    document.getElementById('ptsEarned').textContent  = `+${data.earned}`;
    document.getElementById('ptsSpent').textContent   = `−${data.spent}`;

    // מסך ריק — חשוב שלא יישאר ספינר שמסתובב לנצח
    if (!data.history.length) {
      box.innerHTML = `<div class="empty">
        <h3>No activity yet</h3>
        <p>Sell your first item to start earning points.</p>
      </div>`;
      return;
    }

    // ⭐ escapeHtml על הכותרת — שם המוצר הוקלד
    // על ידי משתמשת אחרת, אז הוא קלט לא מהימן
    box.innerHTML = `<div class="panel">${data.history.map(h => `
      <div class="pts-row">
        <div>
          <strong>${escapeHtml(h.title)}</strong>
          <div class="small muted">${h.type === 'earned' ? 'Sold' : 'Bought with points'}
            · ${formatDate(h.date)}</div>
        </div>
        <!-- ה-type הופך למחלקת CSS: ירוק לנכנס, אדום ליוצא -->
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
// ⭐ כרטיס מותאם ולא productCard המשותף:
// כאן צריך כפתורי "קנה" ו"הסר" שאין בכרטיס
// הרגיל, ולא צריך את הלב (הכול כאן מועדף).

async function loadFavorites() {
  const box = document.getElementById('favorites');
  if (!box) return;

  box.innerHTML = '<div class="spinner"></div>';

  try {
    const products = await api('/api/favorites');
    const usdRate = await getUsdRate();   // מ-currency.js

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
              <!-- escapeHtml: המוכרת הקלידה את הטקסטים האלה -->
              <div class="card-brand">${escapeHtml(p.brand)}</div>
              <div class="card-title">${escapeHtml(p.title)}</div>
              <div class="card-meta">${p.size} · ${p.condition}</div>
              <div class="card-price">
                ${formatPrice(p.price)}
                <span class="muted">≈ $${Math.round(p.price * usdRate)}</span>
            </div>
              

              <div class="flex gap-sm mt">
                <!-- ⭐ פריט שנמכר בזמן שהיה במועדפים:
                     הכפתור נעלם, אבל הכרטיס נשאר -->
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

// ⭐ נקראת מ-onclick בתוך ה-HTML שנוצר למעלה,
// ולכן חייבת להיות גלובלית (לא בתוך פונקציה אחרת)
async function removeFavorite(productId) {
  try {
    // ה-id בנתיב ולא בגוף — זה הסטנדרט ל-DELETE
    await api(`/api/favorites/${productId}`, { method: 'DELETE' });
    showToast('Removed from favorites', 'success');
    loadFavorites();   // מרענן את הרשימה
  } catch (err) {
    showToast(err.message, 'error');
  }
}


// ============================================
// ההזמנות שלי
// ============================================
// ⭐⭐ נקודה חזקה להגנה — החלטת מוצר מודעת:
// אין כאן כפתור ביטול בכוונה:
// קונה שקיבלה את הפריט פיזית הייתה יכולה לבטל
// ולהשאיר את המוכרת בלי הפריט ובלי התמורה.
// ביטול עובר דרך המנהלת, שרואה את שני הצדדים.
//
// לכן גם cancelOrder הוסרה מהשרת לגמרי —
// לא רק הוסתר הכפתור. אין נתיב API לביטול.

async function loadMyOrders() {
  const box = document.getElementById('myOrders');
  if (!box) return;

  box.innerHTML = '<div class="spinner"></div>';

  try {
    // ⭐ /my — השרת מסנן לפי req.user.id מהטוקן,
    // לא לפי id שאנחנו שולחים. לכן אי אפשר
    // לבקש את ההזמנות של מישהי אחרת.
    const orders = await api('/api/orders/my');

    if (!orders.length) {
      box.innerHTML = '<p class="muted">No orders yet.</p>';
      return;
    }

    box.innerHTML = orders.map(o => `
      <div class="order-row">
        <!-- ?. כי המוצר אולי נמחק מאז הקנייה -->
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
      <!-- ⭐ במקום כפתור ביטול: הפניה אלינו.
           כל פנייה נכנסת לטאב ההודעות בדשבורד -->
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
// ⭐ אותן הזמנות, מהצד השני. ההבדל: שם הקונה
// במקום המוכרת, והנקודות שנכנסו במקום הסטטוס.
// בשרת אלה שתי שאילתות על אותו אוסף —
// האחת מסננת לפי buyerId, השנייה לפי sellerId.

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
          <!-- pointsEarned נשמר בהזמנה ולא מחושב מחדש:
               צילום מצב של מה שהתקבל בפועל -->
          <span class="pts-amount earned">+${o.pointsEarned}</span>
          <div class="small muted">points</div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    box.innerHTML = `<p class="field-error">${err.message}</p>`;
  }
}


// ⭐ רץ מיד בטעינת העמוד, בלי קשר לטאב —
// הכותרת והנקודות למעלה מוצגות תמיד
loadProfile();