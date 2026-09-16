// עמוד מוגן — מי שלא מחוברת מועברת להתחברות
if (!requireAuth()) throw new Error('not authenticated');

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

let product = null;
let currentUser = null;


// =========================
// Luhn - card validation
// =========================
// זו הבדיקה שכל חברות האשראי בעולם משתמשות בה.
// 4242424242424242 יעבור, 1234567812345678 ייפסל.
function isValidCard(number) {
  const digits = number.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);

    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }

    sum += d;
    double = !double;
  }

  return sum % 10 === 0;
}


// =========================
// Expiry validation
// =========================
function isValidExpiry(value) {
  const match = value.match(/^(\d{2})\/(\d{2})$/);

  if (!match) return false;

  const month = Number(match[1]);
  const year  = Number(match[2]);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear  = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}


// =========================
// Load product
// =========================
async function loadProduct() {
  if (!productId) {
    throw new Error('Missing product ID');
  }

  // יש נתיב למוצר בודד — אין צורך לשלוף את כל הרשימה
  product = await api(`/api/products/${productId}`);

  if (product.status === 'sold') {
    throw new Error('This item is no longer available');
  }

  // אי אפשר לקנות מוצר של עצמך
  const me = getUser();
  if (me && product.sellerId?._id === me._id) {
    throw new Error('This is your own item');
  }

  document.getElementById('productTitle').textContent = product.title;
  document.getElementById('productPrice').textContent = formatPrice(product.price);

  // מאיפה אוספים את הפריט
  document.getElementById('productSeller').textContent =
    `${product.sellerId?.name || 'Seller'} · pickup from ${product.city || '—'}`;

  if (product.images?.length) {
    document.getElementById('productImage').src = product.images[0];
  }
}


// =========================
// Load user
// =========================
// בודקת אם יש מספיק נקודות, ואם לא —
// נועלת את האפשרות ומסבירה כמה חסר
async function loadUser() {
  const pointsRadio   = document.getElementById('pointsRadio');
  const pointsMessage = document.getElementById('pointsMessage');

  try {
    const data = await api('/api/auth/me');
    currentUser = data.user || data;

    if (!currentUser) {
      throw new Error('User information not found');
    }

    const userPoints   = Number(currentUser.points || 0);
    const productPrice = Number(product.price);

    if (userPoints >= productPrice) {
      pointsRadio.disabled = false;
      pointsMessage.textContent = `(${userPoints} points available)`;

    } else {
      pointsRadio.disabled = true;
      pointsMessage.textContent =
        `(you need ${productPrice - userPoints} more points)`;

      selectCard();
    }

  } catch (err) {
    console.error('Failed to load user:', err);

    currentUser = null;
    pointsRadio.disabled = true;
    pointsMessage.textContent = '(unable to load points)';

    selectCard();
  }
}

// בוחרת אשראי ומציגה את שדות הכרטיס
function selectCard() {
  document.querySelector(
    'input[name="paymentMethod"][value="card"]'
  ).checked = true;

  document.getElementById('cardSection').classList.remove('hidden');
}


// =========================
// Payment method
// =========================
function setupPaymentMethods() {
  const radios = document.querySelectorAll('input[name="paymentMethod"]');
  const cardSection = document.getElementById('cardSection');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      cardSection.classList.toggle('hidden', radio.value === 'points' && radio.checked);
    });
  });
}


// =========================
// אחרי רכישה מוצלחת
// =========================
// מחליף את כל העמוד במסך אישור שנשאר עד שלוחצים.
// ככה המשתמשת מספיקה לקרוא מה קורה הלאה.
async function showSuccess(paymentMethod) {

  // מנקים את פרטי האשראי מהמסך
  ['cardHolder', 'cardNumber', 'expiry', 'cvv'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // מרעננים את המשתמשת כדי שהנקודות ב-navbar יתעדכנו.
  // בלי זה המספר בתפריט נשאר תקוע על הערך הישן.
  let points = null;
  try {
    const user = await api('/api/auth/me');
    localStorage.setItem('rewear_user', JSON.stringify(user));
    points = user.points;
    renderNavbar();
  } catch (err) {
    // לא קריטי — הרכישה כבר הצליחה
  }

  document.getElementById('successSummary').innerHTML = `
    <div class="summary-item">
      <img src="${product.images?.[0] || ''}" alt="">
      <div>
        <strong>${product.title}</strong>
        <div class="muted small">
          ${formatPrice(product.price)} · paid with ${paymentMethod}
        </div>
        <div class="muted small">
          Pickup from ${product.city || '—'}
        </div>
      </div>
    </div>
    ${points !== null && paymentMethod === 'points'
      ? `<p class="muted mt">You have ${points} points left.</p>`
      : ''}
  `;

  document.getElementById('checkoutView').classList.add('hidden');
  document.getElementById('successView').classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// =========================
// Purchase
// =========================
async function purchase() {

  const message = document.getElementById('checkoutMessage');
  message.textContent = '';

  const btn = document.getElementById('payButton');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    const selected = document.querySelector(
      'input[name="paymentMethod"]:checked'
    );

    if (!selected) {
      throw new Error('Please select a payment method');
    }

    const paymentMethod = selected.value;


    // ===== Points =====
    if (paymentMethod === 'points') {

      const userPoints   = Number(currentUser?.points || 0);
      const productPrice = Number(product.price);

      if (userPoints < productPrice) {
        throw new Error(
          `Not enough points. You need ${productPrice - userPoints} more.`
        );
      }

      await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ productId, paymentMethod: 'points' })
      });

      await showSuccess('points');
      return;
    }


    // ===== Card =====
    const cardHolder = document.getElementById('cardHolder').value.trim();
    const cardNumber = document.getElementById('cardNumber').value;
    const expiry     = document.getElementById('expiry').value.trim();
    const cvv        = document.getElementById('cvv').value.trim();

    if (!cardHolder) {
      throw new Error('Cardholder name is required');
    }
    if (!isValidCard(cardNumber)) {
      throw new Error('Invalid card number');
    }
    if (!isValidExpiry(expiry)) {
      throw new Error('Invalid expiry date. Use MM/YY');
    }
    if (!/^\d{3}$/.test(cvv)) {
      throw new Error('CVV must contain 3 digits');
    }

    // CRITICAL: מספר הכרטיס המלא אף פעם לא נשלח לשרת.
    // רק ארבע הספרות האחרונות, לצורך תצוגה בהזמנה.
    const last4 = cardNumber.replace(/\D/g, '').slice(-4);

    await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        paymentMethod: 'card',
        cardLast4: last4
      })
    });

    await showSuccess('card');

  } catch (err) {
    console.error(err);
    message.textContent = err.message;

    // משחררים את הכפתור רק בכישלון —
    // בהצלחה העמוד מתחלף ממילא
    btn.disabled = false;
    btn.textContent = 'Confirm purchase';
  }
}


// =========================
// Start
// =========================
async function init() {
  try {
    await loadProduct();
    await loadUser();
    setupPaymentMethods();

  } catch (err) {
    console.error(err);

    const message = document.getElementById('checkoutMessage');
    if (message) message.textContent = err.message;

    // אם המוצר לא נטען, אין מה לקנות
    const btn = document.getElementById('payButton');
    if (btn) btn.disabled = true;
  }
}


const payButton = document.getElementById('payButton');
if (payButton) {
  payButton.addEventListener('click', purchase);
}

init();