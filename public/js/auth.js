// ============================================
// auth.js — עמוד ההתחברות וההרשמה
// ============================================
// שני טפסים בעמוד אחד, מתחלפים בטאבים.
//
// ⭐ זה העמוד היחיד באתר שאפשר להגיע אליו
// בלי טוקן — ולכן גם היחיד שלא קורא ל-requireAuth.
// להפך: מי שכבר מחוברת מועברת ממנו החוצה (בסוף).
// ============================================


// ===== מעבר בין הטאבים =====
// רק הסתרה והצגה — שני הטפסים קיימים ב-HTML
// מההתחלה, אין טעינה מחדש.

function switchTab(tab) {
  // toggle עם פרמטר שני: מוסיף אם true, מסיר אם false
  document.querySelectorAll('.tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab)
  );
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

// ⭐ כפתור Join בתפריט מפנה ל-/login.html?tab=register,
// וזו השורה שפותחת את הטאב הנכון
// אם הגיעו מכפתור Join — לפתוח ישר את טאב ההרשמה
if (getParam('tab') === 'register') switchTab('register');


// ===== ולידציה =====
// ⭐⭐ חשוב להבין ולומר בהגנה:
// כל הוולידציה כאן היא *נוחות למשתמשת* בלבד,
// לא אבטחה. אפשר לעקוף אותה לגמרי ב-Postman
// או בקונסול, כי היא רצה בדפדפן.
//
// ההגנה האמיתית נמצאת בשלוש שכבות בשרת:
//   register — בודק שכל השדות קיימים
//   מודל User — required, unique, enum, min
//   bcrypt — הסיסמה לא נשמרת כטקסט
//
// למה בכל זאת? כי זה חוסך הלוך-חזור לשרת
// ונותן משוב מיידי.

function isValidEmail(email) {
  // ⭐ ביטוי רגולרי (Regex). פירוק:
  //   ^           תחילת המחרוזת
  //   [^\s@]+     תו אחד או יותר שאינו רווח או @
  //   @           הסימן עצמו
  //   [^\s@]+     שם הדומיין
  //   \.          נקודה (עם \ כי נקודה לבדה = כל תו)
  //   [^\s@]{2,}  סיומת של שני תווים לפחות
  //   $           סוף המחרוזת
  // test מחזיר true/false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  // ⭐ \D = כל מה שאינו ספרה. ה-g = בכל המחרוזת.
  // כך "050-123-4567" ו-"050 1234567" מתקבלים
  // שניהם — מנקים קודם ובודקים אחר כך.
  const digits = phone.replace(/\D/g, '');

  // פורמט ישראלי: עשר ספרות שמתחילות ב-05
  return digits.length === 10 && digits.startsWith('05');
}


// ===== עזר =====
// שתי פונקציות קטנות, כדי לא לחזור על
// אותן שלוש שורות בכל בדיקה

function showError(id, message) {
  const el = document.getElementById(id);
  // ⭐ textContent ולא innerHTML — גם כאן.
  // ההודעה עשויה להגיע מהשרת
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearError(id) {
  document.getElementById(id).classList.add('hidden');
}

// ⭐ מחזירה את המשתמשת לאן שרצתה להגיע.
// requireAuth ב-common.js שמרה את היעד
// בפרמטר redirect לפני שהפנתה לכאן.
//
// הדוגמה: אורחת לוחצת "קנה" על מוצר →
// requireAuth שולחת ל-login.html?redirect=
// %2Fcheckout.html%3Fid%3D123 → אחרי התחברות
// היא חוזרת ישר לאותו מוצר, לא לדף הבית.
// לאן חוזרים אחרי התחברות מוצלחת
function goAfterAuth() {
  const redirect = getParam('redirect');
  return window.location.href = redirect || '/index.html';
}


// ===== התחברות =====

const loginBtn = document.getElementById('loginBtn');

loginBtn.onclick = async () => {
  clearError('loginError');

  // ⭐ trim על המייל, לא על הסיסמה.
  // רווח במייל הוא טעות הקלדה; רווח בסיסמה
  // עשוי להיות חלק ממנה.
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  // ⭐ return לפני showError — עוצר את הפונקציה
  // כאן ולא ממשיך לשלוח לשרת
  if (!email || !password) {
    return showError('loginError', 'Please fill in both fields');
  }
    if (!isValidEmail(email)) {
    return showError('loginError', 'Please enter a valid email address');
  }

  // נועלים את הכפתור — מונע לחיצה כפולה
  // ומראה שמשהו קורה
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    // ⭐ השרת החזיר { token, user }.
    // saveAuth (ב-common.js) שומר את שניהם
    // ב-localStorage — ומכאן המשתמשת מחוברת.
    saveAuth(data.token, data.user);

    showToast(`Welcome back, ${data.user.name}`, 'success');

    // ⭐ 600ms — מספיק כדי לראות את הברכה,
    // לא מספיק כדי להרגיז
    setTimeout(goAfterAuth, 600);

  } catch (err) {
    // ⭐ err.message מגיע מהשרת. במקרה של סיסמה
    // שגויה זה "Invalid email or password" —
    // אותה הודעה גם כשהמייל לא רשום בכלל,
    // בכוונה, כדי לא לגלות אילו כתובות קיימות.
    //
    // שימו לב: api() ב-common.js *לא* מנתקת
    // על 401 מהנתיב הזה, אחרת סיסמה שגויה
    // הייתה זורקת את המשתמשת מהעמוד.
    showError('loginError', err.message);

    // משחררים את הכפתור רק בכישלון —
    // בהצלחה העמוד מתחלף ממילא
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in';
  }
};


// ===== הרשמה =====

const registerBtn = document.getElementById('registerBtn');

registerBtn.onclick = async () => {
  clearError('registerError');

  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const city     = document.getElementById('regCity').value.trim();
  const phone    = document.getElementById('regPhone').value.trim();

  // ⭐ סדר הבדיקות: מהכללי לספציפי.
  // קודם "מילאת הכול?", אחר כך "זה תקין?"
  // כך לא מקבלים "המייל לא תקין" על שדה ריק.
    if (!name || !email || !password || !city || !phone) {
    return showError('registerError', 'Please fill in all fields');
  }
  if (name.length < 2) {
    return showError('registerError', 'Please enter your full name');
  }
  if (!isValidEmail(email)) {
    return showError('registerError', 'Please enter a valid email address');
  }
  // ⭐ זו הבדיקה היחידה על אורך הסיסמה בפועל.
  // ה-minlength: 6 במודל רץ על הסיסמה המוצפנת,
  // שתמיד ארוכה מ-6, אז הוא לא תופס כלום.
  if (password.length < 6) {
    return showError('registerError', 'Password must be at least 6 characters');
  }
  if (!isValidPhone(phone)) {
    return showError('registerError', 'Phone must be 10 digits and start with 05');
  }

  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating account...';

  try {
    // ⭐⭐ חמישה שדות בדיוק — אין role ואין points.
    // גם אם היינו שולחים אותם, register בשרת
    // מפרק רק את החמישה האלה ומתעלם מהשאר.
    // לכן אי אפשר להירשם כמנהלת.
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, city, phone })
    });

    // ⭐ השרת מחזיר טוקן כבר בהרשמה, אז אין
    // צורך להתחבר אחריה — נכנסים ישר פנימה
    saveAuth(data.token, data.user);
    showToast(`Welcome to ReWear, ${data.user.name}`, 'success');
    setTimeout(goAfterAuth, 600);

  } catch (err) {
    // כאן ההודעה הנפוצה היא 409:
    // "This email is already registered"
    showError('registerError', err.message);
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create account';
  }
};


// ===== מי שכבר מחוברת לא צריכה את העמוד הזה =====
// ⭐ היפוך של requireAuth: שם מגרשים את מי
// שאינה מחוברת, כאן את מי שכן.
//
// רץ בסוף הקובץ ולא בתחילתו — כך הטפסים
// והמאזינים מוגדרים גם אם ההפניה נכשלת.
if (getUser()) goAfterAuth();