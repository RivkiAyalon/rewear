// ============================================
// adminRoutes — נתיבי המנהלת
// ============================================
// מחובר ב-server.js תחת '/api/admin'.
// כל נתיב כאן דורש טוקן של מנהלת.
// ============================================

const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

// ⭐⭐ השורה הכי חשובה בקובץ.
// router.use בלי נתיב = רץ על כל בקשה שמגיעה
// לראוטר הזה, לפני כל הנתיבים שמתחתיו.
//
// למה זה עדיף על לכתוב auth, isAdmin בכל שורה?
// כי אי אפשר לשכוח. אם מחר מישהי תוסיף נתיב
// חדש — הוא מוגן אוטומטית.
//
// הסדר חובה: קודם auth (מי את), אחר כך
// isAdmin (מה מותר לך). isAdmin קורא ל-req.user,
// ש-auth מציבה.
// כל מה שמתחת מוגן — שורה אחת שמגנה על כל הקובץ
router.use(auth, isAdmin);

// ===== ניהול משתמשות =====
// :id הוא פרמטר דינמי — מגיע לקונטרולר
// כ-req.params.id
router.get('/users', ctrl.getUsers);

// PUT ולא POST — מעדכנים משאב קיים.
// המבנה /users/:id/role מתאר "השדה role
// של המשתמשת הזו".
router.put('/users/:id/role', ctrl.changeRole);
router.delete('/users/:id', ctrl.deleteUser);

// ===== הזמנות =====
// ⭐ שונה מ-/api/orders/my: שם משתמשת רואה
// את שלה בלבד, כאן המנהלת רואה הכול
// עם פרטי קשר של שני הצדדים.
router.get('/orders', ctrl.getOrders);

// ===== סטטיסטיקות לדשבורד =====
// מחזירה את הנתונים הסטטיסטיים שיוצגו בכרטיסי ה-Admin Dashboard
router.get('/stats', ctrl.getStats);

// שני ה-Aggregate שמזינים את הגרפים
router.get('/sales-by-month', ctrl.getSalesByMonth);
router.get('/top-sellers', ctrl.getTopSellers);

// ===== מוצרים =====
// ⭐ למה נתיב נפרד ולא /api/products?
// כי שם מוחזרים רק available — זה מה
// שהחנות צריכה. המנהלת צריכה לראות גם
// מה שנמכר, אז יש כאן שאילתה בלי סינון.
router.get('/products', ctrl.getProducts);
router.delete('/products/:id', ctrl.deleteProduct);

module.exports = router;