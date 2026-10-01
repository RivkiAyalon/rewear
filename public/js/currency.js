// מסמן שבהתחלה עדיין לא נטען שער המרה
let rate = null;
// מביאה את שער ההמרה משקל לדולר
async function getUsdRate() {
  // אם השער כבר נטען - מחזירה אותו בלי לפנות שוב ל-API
  if (rate) return rate;
  try {
    // פונה ל-API חיצוני ומבקשת שערים כשהשקל הוא מטבע הבסיס
    const res = await fetch('https://open.er-api.com/v6/latest/ILS');
    // ממירה את תשובת ה-API ל-JavaScript object
    const data = await res.json();
    // לוקחת את שער הדולר מתוך כל שערי המטבעות
    rate = data.rates.USD;
  } catch {
    // ערך גיבוי אם ה-API לא זמין
    rate = 0.27;
  }
  // מחזירה את שער ההמרה
  return rate;
}
// ממירה מחיר משקלים לדולרים
async function priceInUsd(ils) {
  // מקבלת את שער ההמרה
  const r = await getUsdRate();
  // מחיר בשקלים כפול השער, ומעגלת לדולר שלם
  return Math.round(ils * r);
}