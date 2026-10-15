const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

// ============================================
// שתי פונקציות עזר פרטיות (בלי exports)
// ============================================

// בונה טוקן. רק id ו-role נכנסים פנימה —
// זה כל מה שהשרת צריך בבקשה הבאה.
function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ⭐ רשימה לבנה: רק השדות האלה יוצאים ללקוח.
// הסיסמה לא ברשימה, אז היא לא יכולה להידלף
// בטעות — גם אם מחר יתווסף שדה חדש למודל.
function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    points: user.points,
    city: user.city,
    phone: user.phone,
    avatar: user.avatar
  };
}

// ============================================
// הרשמה
// ============================================
exports.register = async (req, res) => {
  try {
    // ⭐ מפרקים חמישה שדות מפורשים.
    // role ו-points לא ברשימה, אז אי אפשר
    // להירשם כמנהלת גם דרך Postman.
    const { name, email, password, city, phone } = req.body;

    if (!name || !email || !password || !city || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 409 Conflict = המייל תפוס. ההגנה האמיתית
    // היא unique במודל; זה רק להודעה יפה.
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'This email is already registered' });
    }

    // ⭐ hash חד-כיווני. 10 = כמה סיבובים,
    // כל סיבוב מכפיל את הזמן. גם אם המסד ידלוף,
    // אי אפשר לשחזר את הסיסמה המקורית.
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,   // רק המוצפנת נשמרת
      city,
      phone
    });

    // 201 Created. מחזירים טוקן מיד — כדי
    // שלא תצטרך להתחבר אחרי ההרשמה.
    res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ============================================
// התחברות
// ============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // צריך לבקש את הסיסמה במפורש, כי במודל היא select: false
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // ⭐ אותה הודעה לשני המקרים, בכוונה.
    // "אין משתמשת כזו" היה מגלה למי שמנסה
    // אילו כתובות רשומות אצלנו.
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // compare מצפין את מה שהוקלד ומשווה להאש.
    // אין פענוח — רק השוואה.
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================
// הפרטים שלי
// ============================================
// רץ אחרי auth, אז req.user.id כבר קיים.
// שולפים מהמסד ולא מהטוקן — כי הנקודות
// משתנות אחרי כל קנייה.
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================
// עדכון פרטים
// ============================================
exports.updateMe = async (req, res) => {
  try {
    // ⭐ הגנה מ-mass assignment.
    // רק שלושת השדות האלה נלקחים. אם נכתוב
    // { ...req.body } — אפשר יהיה לשלוח
    // { points: 999999 } ולהתעשר.
    const { name, city, phone } = req.body;

    // שדות שאסור לשנות דרך כאן: email, role, points, password
    const user = await User.findByIdAndUpdate(
      req.user.id,              // תמיד את עצמה, לא id מה-URL
      { name, city, phone },
      {
        new: true,              // מחזיר את הגרסה אחרי העדכון
        runValidators: true     // מפעיל את כללי המודל גם בעדכון
      }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(publicUser(user));

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ============================================
// הנקודות שלי
// ============================================
// בונה מסך "תנועות בחשבון": יתרה, כמה נכנס,
// כמה יצא, ורשימה מאוחדת.
exports.getPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // מכירות — כאן צברה נקודות
    // populate מחליף את ה-ObjectId במסמך עצמו.
    // 'title' = להביא רק את השדה הזה.
    const sales = await Order.find({ sellerId: req.user.id, status: 'completed' })
      .sort({ createdAt: -1 })
      .populate('productId', 'title')
      .populate('buyerId', 'name');

    // קניות ששולמו בנקודות — כאן הוציאה
    // ⭐ שלושה תנאים: היא הקונה, ההזמנה הושלמה,
    // ושולם בנקודות. קנייה באשראי לא מורידה נקודות.
    const purchases = await Order.find({
      buyerId: req.user.id,
      status: 'completed',
      paymentMethod: 'points'
    })
      .sort({ createdAt: -1 })
      .populate('productId', 'title');

    // reduce מסכם מערך למספר אחד. ה-0 בסוף
    // הוא ערך ההתחלה — בלעדיו מערך ריק יקרוס.
    const earned = sales.reduce((sum, o) => sum + o.pointsEarned, 0);
    const spent  = purchases.reduce((sum, o) => sum + o.price, 0);

    // מאחדים לרשימה אחת ממוינת לפי תאריך
    // ⭐ שני מערכים שונים הופכים לפורמט אחיד
    // עם type, amount, title, date — ואז מתמזגים
    // עם ... וממוינים. ככה הפרונט מרנדר לולאה אחת.
    const history = [
      ...sales.map(o => ({
        type: 'earned',
        amount: o.pointsEarned,
        // ?. כי אולי המוצר נמחק מאז
        title: o.productId?.title || 'Item',
        date: o.createdAt
      })),
      ...purchases.map(o => ({
        type: 'spent',
        amount: o.price,
        title: o.productId?.title || 'Item',
        date: o.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));  // b-a = חדש ראשון

    // ⭐ balance מגיע מהמסד, לא מ-earned פחות spent.
    // המסד הוא מקור האמת.
    res.json({ balance: user.points, earned, spent, history });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};