// עמוד מוגן — מי שלא מחוברת מועברת להתחברות
if (!requireAuth()) throw new Error('not authenticated');

// ===== טאבים =====

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-panel').forEach(panel =>
    panel.classList.toggle('hidden', panel.id !== `tab-${tab}`)
  );
  history.replaceState(null, '', `?tab=${tab}`);
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

// פתיחת הטאב לפי הכתובת — ה-navbar מפנה ל-?tab=sell וכו'
const startTab = getParam('tab') || 'details';
switchTab(startTab);

// ===== טעינת המשתמשת =====

async function loadProfile() {
  try {
    // מביאים מהשרת ולא מ-localStorage, כדי שהנקודות יהיו מעודכנות
    const user = await api('/api/auth/me');
    localStorage.setItem('rewear_user', JSON.stringify(user));

    document.getElementById('profileName').textContent   = user.name;
    document.getElementById('profileMeta').textContent   = `${user.city || ''} · ${user.email}`;
    document.getElementById('profileAvatar').textContent = user.name[0];
    document.getElementById('profilePoints').textContent = user.points;

    document.getElementById('detName').value  = user.name;
    document.getElementById('detEmail').value = user.email;
    document.getElementById('detCity').value  = user.city  || '';
    document.getElementById('detPhone').value = user.phone || '';

  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===== שמירת פרטים =====

const saveBtn = document.getElementById('saveDetails');

saveBtn.onclick = async () => {
  document.getElementById('detError').classList.add('hidden');

  const name  = document.getElementById('detName').value.trim();
  const city  = document.getElementById('detCity').value.trim();
  const phone = document.getElementById('detPhone').value.trim();

  if (!name || !city || !phone) {
    const el = document.getElementById('detError');
    el.textContent = 'Please fill in all fields';
    el.classList.remove('hidden');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const user = await api('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ name, city, phone })
    });

    localStorage.setItem('rewear_user', JSON.stringify(user));
    showToast('Your details were saved', 'success');
    renderNavbar();      // מרענן את השם בתפריט
    loadProfile();

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save changes';
  }
};

loadProfile();