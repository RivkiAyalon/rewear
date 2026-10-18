// ייבוא ספריית Express להגדרת נתיבים וראוטינג בשרת
const express = require('express');

// יצירת אובייקט Router של Express לריכוז וניהול כל הנתיבים של המוצרים
const router = express.Router();

// ייבוא פונקציית התיווך (Middleware) לאימות טוקן והגנה על נתיבים סגורים
const { auth } = require('../middleware/auth');

// ייבוא פונקציות הלוגיקה והשאילתות מתוך קונטרולר המוצרים (productController)
const ctrl = require('../controllers/productController');

// ============================================
// הגדרת נתיבי ה-API עבור מוצרים (Endpoints)
// ============================================

// GET /api/products - שליפת כל המוצרים עם סינון, חיפוש וחלוקה לעמודים (נתיב ציבורי, פתוח לכולם)
router.get('/', ctrl.getProducts);

// GET /api/products/my - שליפת המוצרים של המשתמשת המחוברת בלבד (נתיב מוגן, דורש אימות auth)
router.get('/my', auth, ctrl.getMyProducts);

// GET /api/products/:id - שליפת פרטי מוצר יחיד לפי מזהה ייחודי (נתיב ציבורי, מזהה מועבר ב-URL Parameter)
router.get('/:id', ctrl.getProduct);

// POST /api/products - יצירת מוצר חדש (נתיב מוגן, מורשה רק למשתמשת מחוברת)
router.post('/', auth, ctrl.createProduct);

// PUT /api/products/:id - עדכון פריט קיים לפי ID (נתיב מוגן, בדיקת הבעלות מתבצעת בקונטרולר)
router.put('/:id', auth, ctrl.updateProduct);

// DELETE /api/products/:id - מחיקת פריט מהחנות לפי ID (נתיב מוגן, מורשה רק לבעלת הפריט או למנהלת)
router.delete('/:id', auth, ctrl.deleteProduct);

// ייצוא אובייקט ה-Router לשימוש בקובץ השרת הראשי (server.js)
module.exports = router;