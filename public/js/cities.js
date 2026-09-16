// ============================================
// רשימת יישובים בישראל — API של data.gov.il
// ============================================

const CITIES_URL =
  'https://data.gov.il/api/3/action/datastore_search' +
  '?resource_id=d4901968-dad3-4845-a9b0-a57d027f11ab&limit=1500';


// מביאה את הרשימה מה-API, ואם הוא נופל —
// נופלת לקובץ הגיבוי המקומי
async function loadCities() {
  try {
    const res = await fetch(CITIES_URL);
    if (!res.ok) throw new Error('Cities API failed');

    const data = await res.json();

    return data.result.records
      .map(r => r['שם_ישוב'].trim())
      .filter(Boolean)
      .sort();

  } catch (err) {
    console.warn('Cities API unavailable, using local fallback');
    const res = await fetch('/js/cities.json');
    return res.json();
  }
}


// ממלאת <select> ברשימת הערים.
// שומרת ערך קיים (למשל בעריכת פרופיל) ומחזירה אותו
// אחרי שהרשימה נטענה.
async function populateCities(selectId = 'shippingCity') {
  const select = document.getElementById(selectId);
  if (!select) return;

  // אם כבר מולא — לא ממלאים שוב
  if (select.dataset.filled) return;
  select.dataset.filled = 'true';

  const current = select.dataset.value || select.value || '';

  const cities = await loadCities();

  // שומרים את האפשרות הריקה הראשונה ומוסיפים אחריה
  const placeholder = select.options[0]?.outerHTML || '';
  select.innerHTML = placeholder + cities
    .map(c => `<option value="${c}">${c}</option>`)
    .join('');

  // מחזירים את הערך שהיה — גם אם loadProfile
  // הציבה אותו לפני שהרשימה נטענה
  if (current) select.value = current;
}


// כל קריאה בודקת אם האלמנט קיים בעמוד,
// אז אפשר לקרוא לכולן בכל עמוד בלי חשש
populateCities();             // checkout.html
populateCities('regCity');    // login.html — הרשמה
populateCities('detCity');    // profile.html — פרטים אישיים
populateCities('city');       // profile.html — טופס פרסום מוצר