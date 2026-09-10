// ===== מעבר בין הטאבים =====

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab)
  );
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

// אם הגיעו מכפתור Join — לפתוח ישר את טאב ההרשמה
if (getParam('tab') === 'register') switchTab('register');


// ===== ולידציה =====

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && digits.startsWith('05');
}


// ===== עזר =====

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearError(id) {
  document.getElementById(id).classList.add('hidden');
}

// לאן חוזרים אחרי התחברות מוצלחת
function goAfterAuth() {
  const redirect = getParam('redirect');
  window.location.href = redirect || '/index.html';
}

// ===== התחברות =====

const loginBtn = document.getElementById('loginBtn');

loginBtn.onclick = async () => {
  clearError('loginError');

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    return showError('loginError', 'Please fill in both fields');
  }
    if (!isValidEmail(email)) {
    return showError('loginError', 'Please enter a valid email address');
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    saveAuth(data.token, data.user);
    showToast(`Welcome back, ${data.user.name}`, 'success');
    setTimeout(goAfterAuth, 600);

  } catch (err) {
    showError('loginError', err.message);
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

    if (!name || !email || !password || !city || !phone) {
    return showError('registerError', 'Please fill in all fields');
  }
  if (name.length < 2) {
    return showError('registerError', 'Please enter your full name');
  }
  if (!isValidEmail(email)) {
    return showError('registerError', 'Please enter a valid email address');
  }
  if (password.length < 6) {
    return showError('registerError', 'Password must be at least 6 characters');
  }
  if (!isValidPhone(phone)) {
    return showError('registerError', 'Phone must be 10 digits and start with 05');
  }

  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating account...';

  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, city, phone })
    });

    saveAuth(data.token, data.user);
    showToast(`Welcome to ReWear, ${data.user.name}`, 'success');
    setTimeout(goAfterAuth, 600);

  } catch (err) {
    showError('registerError', err.message);
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create account';
  }
};

// ===== מי שכבר מחוברת לא צריכה את העמוד הזה =====

if (getUser()) goAfterAuth();