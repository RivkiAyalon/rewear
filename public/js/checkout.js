const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

let product = null;
let currentUser = null;

// =========================
// API
// =========================
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
// Luhn - card validation
// =========================
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

      if (d > 9) {
        d -= 9;
      }
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

  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const year = Number(match[2]);

  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}

// =========================
// Load product
// =========================
async function loadProduct() {
  if (!productId) {
    throw new Error('Missing product ID');
  }

  const products = await api('/api/products');

  product = products.find(
    p => String(p._id) === String(productId)
  );

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.status === 'sold') {
    throw new Error('This item is no longer available');
  }

  document.getElementById('productTitle').textContent =
    product.title;

  document.getElementById('productPrice').textContent =
    `${product.price} ₪`;

  if (product.images && product.images.length > 0) {
    document.getElementById('productImage').src =
      product.images[0];
  }
}

// =========================
// Load user
// =========================
async function loadUser() {
  const pointsRadio =
    document.getElementById('pointsRadio');

  const pointsMessage =
    document.getElementById('pointsMessage');

  try {
    const data = await api('/api/auth/me');

    // Support both { user: {...} } and direct {...}
    currentUser = data.user || data;

    if (!currentUser) {
      throw new Error('User information not found');
    }

    const userPoints =
      Number(currentUser.points || 0);

    const productPrice =
      Number(product.price);

    if (userPoints >= productPrice) {

      pointsRadio.disabled = false;

      pointsMessage.textContent =
        ` (${userPoints} points available)`;

    } else {

      pointsRadio.disabled = true;

      pointsMessage.textContent =
        ` (You need ${productPrice - userPoints} more points)`;

      document.querySelector(
        'input[name="paymentMethod"][value="card"]'
      ).checked = true;

      document.getElementById(
        'cardSection'
      ).style.display = 'block';
    }

  } catch (err) {

    console.error('Failed to load user:', err);

    currentUser = null;

    pointsRadio.disabled = true;

    pointsMessage.textContent =
      ' (Unable to load points)';

    document.querySelector(
      'input[name="paymentMethod"][value="card"]'
    ).checked = true;

    document.getElementById(
      'cardSection'
    ).style.display = 'block';
  }
}
// =========================
// Payment method
// =========================
function setupPaymentMethods() {

  const radios =
    document.querySelectorAll(
      'input[name="paymentMethod"]'
    );

  const cardSection =
    document.getElementById('cardSection');

  radios.forEach(radio => {

    radio.addEventListener('change', () => {

      if (
        radio.value === 'card' &&
        radio.checked
      ) {
        cardSection.style.display = 'block';
      }

      if (
        radio.value === 'points' &&
        radio.checked
      ) {
        cardSection.style.display = 'none';
      }

    });

  });
}

// =========================
// Purchase
// =========================
async function purchase() {

  const message =
    document.getElementById('checkoutMessage');

  message.textContent = '';

  try {
    const selectedPayment =
      document.querySelector(
        'input[name="paymentMethod"]:checked'
      );

    if (!selectedPayment) {
      throw new Error(
        'Please select a payment method'
      );
    }

    const paymentMethod =
      selectedPayment.value;

    // =====================
    // Points
    // =====================
    if (paymentMethod === 'points') {

      const userPoints =
        Number(currentUser?.points || 0);

      const productPrice =
        Number(product.price);

      if (userPoints < productPrice) {

        throw new Error(
          `Not enough points. You need ${productPrice - userPoints} more points.`
        );

      }

      const result = await api(
        '/api/orders',
        {
          method: 'POST',

          body: JSON.stringify({
            productId,
            paymentMethod: 'points'
          })
        }
      );

      message.textContent =
        'Purchase completed successfully! The seller will be contacted through the website soon with the pickup details.';

      console.log(result);

      return;
    }

    // =====================
    // Card
    // =====================

    const cardHolder =
      document.getElementById(
        'cardHolder'
      ).value.trim();

    const cardNumber =
      document.getElementById(
        'cardNumber'
      ).value;

    const expiry =
      document.getElementById(
        'expiry'
      ).value.trim();

    const cvv =
      document.getElementById(
        'cvv'
      ).value.trim();

    if (!cardHolder) {
      throw new Error(
        'Card holder name is required'
      );
    }

    if (!isValidCard(cardNumber)) {
      throw new Error(
        'Invalid card number'
      );
    }

    if (!isValidExpiry(expiry)) {
      throw new Error(
        'Invalid expiry date. Use MM/YY'
      );
    }

    if (!/^\d{3}$/.test(cvv)) {
      throw new Error(
        'CVV must contain 3 digits'
      );
    }

    // Only the last 4 digits are sent.
    const last4 =
      cardNumber
        .replace(/\D/g, '')
        .slice(-4);

    const result = await api(
      '/api/orders',
      {
        method: 'POST',

        body: JSON.stringify({
          productId,
          paymentMethod: 'card',
          cardLast4: last4
        })
      }
    );

    message.textContent =
      'Purchase completed successfully! The seller will be contacted through the website soon with the pickup details.';

    console.log(result);

  } catch (err) {

    console.error(err);

    message.textContent =
      err.message;
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

    const message =
      document.getElementById(
        'checkoutMessage'
      );

    if (message) {
      message.textContent =
        err.message;
    }
  }
}

// =========================
// Pay button
// =========================
const payButton =
  document.getElementById('payButton');

if (payButton) {

  payButton.addEventListener(
    'click',
    purchase
  );

}

init();