// ============================================
// authRoutes — נתיבי הזדהות
// ============================================
// Router הוא "תת-אפליקציה": אוסף נתיבים
// שמחוברים ב-server.js תחת קידומת אחת.
//
//   app.use('/api/auth', require('./routes/authRoutes'))
//
// כלומר '/login' כאן = '/api/auth/login' בפועל.
// הקובץ לא מכיר את הקידומת שלו.
// ============================================

const { auth } = require('../middleware/auth');

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

// ⭐ הראוטר רק מנתב — כל הלוגיקה בקונטרולר.
// זו הפרדת אחריות: כאן רואים במבט אחד
// מה פתוח ומה מוגן.

// ===== פתוח לכולן =====
// חייבים להיות פתוחים — מי שנרשמת עדיין
// אין לה טוקן, אז auth היה חוסם אותה.
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// ===== מוגן — רק למחוברות =====
// ⭐ auth רץ לפני הקונטרולר ומציב req.user.
// בלעדיו getMe לא היה יודע מי שואלת.
//
// שימו לב: אותו נתיב '/me' פעמיים, בשתי
// מתודות. GET קורא, PUT מעדכן — Express
// מפריד ביניהם לפי המתודה.
router.get('/me', auth, ctrl.getMe);
router.put('/me', auth, ctrl.updateMe);
router.get('/points', auth, ctrl.getPoints);

module.exports = router;