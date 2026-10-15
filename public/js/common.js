// ============================================
// common.js — התשתית של כל האתר
// ============================================
// נטען ראשון בכל עמוד, לפני כל קובץ JS אחר.
// ⭐ הסדר קריטי: כל שאר הקבצים קוראים ל-api()
// ול-showToast() שמוגדרות כאן. אם הוא היה
// אחרון, הם היו קורסים.
// ============================================


// ============ Auth helpers ============
// ⭐ למה localStorage ולא משתנה רגיל?
// כי משתנה נמחק ברענון. localStorage שורד
// סגירת דפדפן, אז נשארים מחוברות.

function getToken() {
  return localStorage.getItem('rewear_token');
}

function getUser() {
  const raw = localStorage.getItem('rewear_user');
  // localStorage שומר מחרוזות בלבד, אז מפענחים חזרה
  return raw ? JSON.parse(raw) : null;
}

function saveAuth(token, user) {
  localStorage.setItem('rewear_token', token);
  // JSON.stringify — אובייקט לא נשמר כמו שהוא
  localStorage.setItem('rewear_user', JSON.stringify(user));
}

// ⭐ התנתקות היא לקוח בלבד — אין קריאה לשרת.
// זה נובע מכך ש-JWT הוא stateless: השרת לא
// מחזיק רשימת מחוברות, אז אין מה לבטל אצלו.
// הטוקן נשאר תקף עד שיפוג, פשוט אין לנו אותו.
function logout() {
  localStorage.removeItem('rewear_token');
  localStorage.removeItem('rewear_user');
  window.location.href = '/index.html';
}

// ⭐ שומרת על עמודים מוגנים. נקראת בשורה
// הראשונה של profile.js ו-checkout.js:
//   if (!requireAuth()) throw new Error(...)
// ה-throw עוצר את שאר הקובץ, כדי שלא ירוץ
// קוד בזמן שהדפדפן כבר בדרך לעמוד אחר.
function requireAuth() {
  if (!getToken()) {
    // ⭐ שומרים לאן רצתה להגיע, כדי להחזיר אותה
    // לשם אחרי ההתחברות. pathname + search ולא
    // pathname בלבד — אחרת product.html?id=123
    // היה חוזר בלי ה-id.
    // encodeURIComponent מקודד את ה-? וה-&
    // שלא ישברו את הכתובת החדשה.
    window.location.href = '/login.html?redirect=' +
            encodeURIComponent(window.location.pathname + window.location.search);
    return false;
  }
  return true;
}

// ⭐ זו נוחות, לא אבטחה!
// היא רק מסתירה את העמוד. ההגנה האמיתית
// היא isAdmin בשרת: גם אם מישהי תערוך את
// ה-localStorage ותרשום role: 'admin',
// היא תראה את admin.html — אבל כל קריאת API
// תחזור 403 והטבלאות יישארו ריקות.
function requireAdmin() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}


// ============ API ============
// ⭐⭐ הפונקציה המרכזית בפרויקט.
// כל קריאה לשרת באתר עוברת דרכה — אין אף
// fetch ישיר לשרת שלנו בשום קובץ אחר.
// היתרון: הטוקן, הכותרות וטיפול השגיאות
// כתובים פעם אחת.

async function api(path, options = {}) {
  const token = getToken();

  const res = await fetch(path, {
    // ...options מעתיק method ו-body שהמתקשרת שלחה
    ...options,
    headers: {
      'Content-Type': 'application/json',

      // ⭐ מוסיף את הטוקן רק אם קיים.
      // זה בדיוק מה ש-auth.js בשרת מפרק עם split(' ')
      ...(token && { Authorization: `Bearer ${token}` }),

      // אחרון — כדי שאפשר יהיה לדרוס במקרה חריג
      ...options.headers
    }
  });

  // catch כי תשובה ריקה (204) תשבור את json()
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // בעמודי ההזדהות 401 אומר "פרטים שגויים", לא "הטוקן פג"
    // ⭐ בלי הבדיקה הזו, סיסמה שגויה הייתה
    // מנתקת את המשתמשת במקום להציג שגיאה
    const isAuthCall = path.includes('/api/auth/login') ||
                       path.includes('/api/auth/register');
    if (!isAuthCall) {
      logout();   // הטוקן פג — מנקים ושולחים להתחברות
    }
    throw new Error(data.message || 'Session expired');
  }

  // ⭐ fetch לא זורק שגיאה על 404 או 500 —
  // הוא רואה בהם תשובה תקינה. לכן בודקים ידנית.
  // ה-throw מאפשר לכל המתקשרות לעטוף ב-try/catch.
  if (!res.ok) {
    // data.message היא ההודעה שהקונטרולר החזיר
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}


// ============ Formatting ============
// פונקציות עזר, כדי שמחיר ותאריך ייראו
// אותו דבר בכל עמוד

function formatPrice(n) {
  // toLocaleString מוסיף פסיקים: 1200 → 1,200
  return `₪${Number(n).toLocaleString('en-US')}`;
}

function formatDate(iso) {
  // מונגו מחזיר ISO מכוער, זה הופך ל-15 Oct 2026
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ⭐⭐ הגנת XSS — נקודה חזקה להגנה.
// הטריק: textContent מתייחס לטקסט כטקסט בלבד,
// והדפדפן מקודד לבד. אחר כך innerHTML מחזיר
// את הגרסה המקודדת.
//   <img src=x onerror="alert(1)">
//   →  &lt;img src=x onerror="alert(1)"&gt;
// הדפדפן יציג את התווים ולא יריץ אותם.
//
// נדרש בכל מקום שמזריקים קלט משתמש ל-innerHTML.
// הקריטי ביותר: טבלת ההודעות בדשבורד, כי שם
// הטקסט מגיע מאורחת אנונימית.
//
// ?? '' — אם הערך null או undefined, מחזיר ריק
// במקום להדפיס "undefined"
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}


// ============ Shared product card ============
// ⭐ כרטיס אחד שמשמש את דף הבית, החנות
// והמועדפים. שינוי כאן משנה את כל האתר.
// (הלבבות — מפתחת 4)

function productCard(p) {
  return `
    <a href="/product.html?id=${p._id}" class="card">
      <div class="card-media">
        <img src="${p.images?.[0] || ''}" alt="${p.title}">

        ${p.status === 'sold'
          ? '<span class="badge badge-sold card-fav">Sold</span>'
          : ''
        }

        <span
          class="card-heart"
          data-favorite-id="${p._id}"
          data-favorite="false"
          title="Favorite"
          role="button"
        >♡</span>
      </div>

      <div class="card-body">
        <div class="card-brand">${p.brand || ''}</div>
        <div class="card-title">${p.title}</div>
        <div class="card-meta">${p.size} · ${p.condition}</div>

        <div class="card-price">
          ${formatPrice(p.price)}
          ${p.usdPrice != null
            ? `<span class="muted">≈ $${p.usdPrice}</span>`
            : ''
          }
        </div>
      </div>
    </a>
  `;
}

// מעדכן את כל הלבבות של אותו מוצר בבת אחת —
// אם הוא מופיע גם ברשת וגם במקום אחר בעמוד
function setFavoriteHeartState(productId, isFavorite) {
  document
    .querySelectorAll(`[data-favorite-id="${productId}"]`)
    .forEach(heart => {
      heart.dataset.favorite = isFavorite ? 'true' : 'false';
      heart.textContent = isFavorite ? '♥' : '♡';
    });
}

// ⭐ קריאה אחת לשרת לכל העמוד, לא אחת לכל כרטיס.
// Set ולא מערך כי has() מהיר מ-includes()
async function refreshFavoriteHearts() {
  const hearts = document.querySelectorAll('[data-favorite-id]');

  if (!hearts.length) return;

  // משתמשת לא מחוברת
  if (!getToken()) {
    hearts.forEach(heart => {
      heart.dataset.favorite = 'false';
      heart.textContent = '♡';
    });
    return;
  }

  try {
    const favorites = await api('/api/favorites');

    const favoriteIds = new Set(
      favorites.map(product => product._id)
    );

    hearts.forEach(heart => {
      const isFavorite = favoriteIds.has(
        heart.dataset.favoriteId
      );

      heart.dataset.favorite =
        isFavorite ? 'true' : 'false';

      heart.textContent =
        isFavorite ? '♥' : '♡';
    });

  } catch (err) {
    // כישלון כאן לא אמור לשבור את העמוד
    console.log(
      'Could not load favorites:',
      err.message
    );
  }
}

// ⭐ pageshow ולא load — הוא נורה גם כשחוזרים
// עם כפתור "אחורה". בלעדיו, לב שהוסר במועדפים
// היה נראה מלא אחרי חזרה לחנות.
window.addEventListener('pageshow', () => {
  refreshFavoriteHearts();
});

// ⭐ Event delegation: מאזין אחד על document
// במקום מאזין לכל לב. חשוב כי הכרטיסים נוצרים
// דינמית — לב שנוצר אחרי טעינת העמוד עדיין עובד.
document.addEventListener('click', async (e) => {
  // closest מטפס מה-target כלפי מעלה
  const heart = e.target.closest('[data-favorite-id]');

  if (!heart) return;   // נלחץ משהו אחר

  // שלא יפתח את עמוד המוצר כשלוחצים על הלב
  // (הלב יושב בתוך <a>)
  e.preventDefault();
  e.stopPropagation();

  if (!getToken()) {
    window.location.href =
      '/login.html?redirect=' +
      encodeURIComponent(
        window.location.pathname + window.location.search
      );
    return;
  }

  const productId = heart.dataset.favoriteId;
  const isFavorite =
    heart.dataset.favorite === 'true';

  try {
    if (isFavorite) {
      await api(`/api/favorites/${productId}`, {
        method: 'DELETE'
      });

      setFavoriteHeartState(productId, false);
      showToast('Removed from favorites', 'success');

    } else {
      await api('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({
          productId
        })
      });

      setFavoriteHeartState(productId, true);
      showToast('Added to favorites', 'success');
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
});



// ============ Toast messages ============
// ⭐ מחליף את alert(): לא חוסם, לא מכוער,
// ונעלם לבד. בשימוש בכל האתר.
// textContent ולא innerHTML — אז בטוח מ-XSS.

function showToast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);

  // ⭐ ה-10ms לא סתם: צריך שהאלמנט ייכנס ל-DOM
  // לפני שמוסיפים את show, אחרת אין מעבר להנפיש
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    // מוחקים רק אחרי שהאנימציה נגמרה
    setTimeout(() => el.remove(), 300);
  }, 3000);
}


// ============ Query string ============
// ⭐ קוראת פרמטר מהכתובת.
// ?tab=orders → getParam('tab') = 'orders'
// משמשת לטאבים בפרופיל ובדשבורד, ל-id בעמוד
// מוצר, ולסינון בחנות. מחזירה null אם אין.
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}


// ============ Layout ============
// ⭐ התפריט נבנה ב-JS ולא ב-HTML, כי הוא
// משתנה לפי המשתמשת. כך הוא כתוב פעם אחת
// במקום עשר פעמים בעשרה קבצים — שינוי קישור
// מתעדכן בכל האתר.

function renderNavbar() {
  const user = getUser();
  const el = document.getElementById('navbar');
  if (!el) return;   // עמוד בלי תפריט

  // גרסה לאורחת
  const guestLinks = `
    <a href="/login.html" class="nav-link">Sign in</a>
    <a href="/login.html?tab=register" class="btn btn-primary btn-sm">Join</a>
  `;

  // גרסה למחוברת
  const userLinks = `
    <a href="/profile.html?tab=favorites" class="nav-link">Favorites</a>
    <a href="/profile.html?tab=sell" class="btn btn-primary btn-sm">Sell an item</a>
    <div class="nav-user">
      <!-- האות הראשונה של השם כאווטאר -->
      <button class="nav-avatar" id="userMenuBtn">${user?.name?.[0] ?? '?'}</button>
      <div class="nav-dropdown" id="userMenu">
        <div class="nav-dropdown-head">
          <strong>${user?.name ?? ''}</strong>
          <span>${user?.points ?? 0} points</span>
        </div>
        <a href="/profile.html">My profile</a>
        <a href="/profile.html?tab=items">My items</a>
        <a href="/profile.html?tab=orders">My orders</a>
        <!-- ⭐ קישור הדשבורד מוצג רק למנהלת.
             שוב: הסתרה, לא הגנה. ההגנה בשרת. -->
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

  // ⭐ המאזינים חייבים להיות *אחרי* ה-innerHTML —
  // לפניו הכפתורים עוד לא קיימים ב-DOM
  const btn = document.getElementById('userMenuBtn');
  if (btn) {   // קיים רק אצל מחוברת
    btn.onclick = e => {
      // ⭐ בלי stopPropagation הלחיצה הייתה
      // ממשיכה ל-document ומיד סוגרת את התפריט
      e.stopPropagation();
      document.getElementById('userMenu').classList.toggle('open');
    };
    // לחיצה בכל מקום אחר סוגרת
    document.onclick = () =>
      document.getElementById('userMenu')?.classList.remove('open');
    document.getElementById('logoutBtn').onclick = logout;
  }
}

// פוטר קבוע — אותו דבר בכל עמוד
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

// ⭐ DOMContentLoaded — ה-HTML נטען במלואו.
// בלי זה, getElementById('navbar') היה מחזיר
// null כי ה-div עדיין לא קיים.
// זו הסיבה שכל עמוד צריך רק
// <div id="navbar"></div> ו-<div id="footer"></div>
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
});