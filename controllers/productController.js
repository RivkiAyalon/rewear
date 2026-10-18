// טעינת מודל המשתמשות כדי לאפשר חיבור וקישור (populate) לפרטי המוכרת
require('../models/User');

// ייבוא מודל המוצרים לביצוע שאילתות ופעולות מול קולקשן המוצרים ב-MongoDB
const Product = require('../models/Product');

// ============================================
// שליפת רשימת מוצרים מסוננת, ממוינת ומחולקת לעמודים (Pagination)
// ============================================
// GET all products
exports.getProducts = async (req, res) => {
  try {
    // פירוק הפרמטרים מתוך ה-URL (קריאת Query Parameters)
    const { search, sort, page = 1 } = req.query;

    // הגדרת מסנן בסיסי (Filter) - הצגת מוצרים שזמינים למכירה בלבד
    const filter = { status: 'available' };

    // חיפוש טקסטואלי חופשי בכותרת או במותג באמצעות ביטוי רגולרי ($regex) ללא הבדל בין אותיות גדולות לקטנות
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // סינון דינמי לפי קטגוריות, מידה, עיר, מותג ומגדר במידה ונשלחו בבקשה
    ['gender', 'category', 'type', 'size', 'condition', 'brand', 'city']
      .forEach(f => {
        if (req.query[f]) {
          filter[f] = req.query[f];
        }
      });

    // סינון לפי טווח מחירים: $gte (גדול/שווה) ו-$lte (קטן/שווה)
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};

      if (req.query.minPrice) {
        filter.price.$gte = Number(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        filter.price.$lte = Number(req.query.maxPrice);
      }
    }

    // אובייקט מיפוי מיון (Sorting) - לפי מחיר, פופולריות או תאריך יצירה
    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      popular: { views: -1 }
    };

    // חישוב חלוקה לעמודים (פג'ינציה) - כמה פריטים להחזיר וכמה לדלג (skip & limit)
    const limit = Number(req.query.limit) || 12;
    const pageNumber = Number(page) || 1;

    // הרצת השאילתה ב-MongoDB ופנייה למודל המשתמשות (populate) להבאת שם ועיר המוכרת
    const products = await Product.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .populate('sellerId', 'name city');

    // ספירת סך כל המוצרים המתאימים לסינון לצורך חישוב מספר העמודים הכולל
    const total = await Product.countDocuments(filter);

    // החזרת תשובת JSON ללקוח עם תוצאות החיפוש ומטא-דאטה על העמודים
    res.json({
      products,
      total,
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    // טיפול בשגיאות שרת (Status 500)
    res.status(500).json({ message: err.message });
  }
};

// ============================================
// שליפת מוצר בודד לפי מזהה ייחודי (ID) ועדכון מונה צפיות
// ============================================
// GET single product
exports.getProduct = async (req, res) => {
  try {
    // איתור המוצר לפי ID, העלאת מספר הצפיות ב-1 ($inc) והבאת פרטי יצירת הקשר של המוכרת
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true } // החזרת המסמך המעודכן לאחר השינוי
    ).populate('sellerId', 'name city phone');

    // אם המוצר לא קיים - החזרת שגיאת 404 (Not Found)
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(404).json({ message: 'Product not found' });
  }
};

// ============================================
// שליפת כל המוצרים של המשתמשת המחוברת כרגע
// ============================================
// GET my products
exports.getMyProducts = async (req, res) => {
  try {
    // שליפת מוצרים מ-MongoDB שה-sellerId שלהם תואם לזיהוי המשתמשת מהטוקן (req.user)
    const products = await Product.find({ sellerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================
// יצירת מוצר חדש במערכת
// ============================================
// POST create product
exports.createProduct = async (req, res) => {
  try {

    // ניקוי והגנה על הנתונים (Sanitization) - הסרת שדות שהלקוח לא מורשה לקבוע בעצמו
    delete req.body.status;
    delete req.body.views;
    delete req.body.sellerId;

    // יצירת מופע חדש של המודל, הצמדת ה-ID של המשתמשת ושמירה במסד הנתונים
    const product = new Product({
      ...req.body,
      sellerId: req.user.id
    });
    await product.save();

    // החזרת תשובת 201 (Created) עם הפרטים של המוצר שנוצר
    res.status(201).json(product);
  } catch (err) {
    // החזרת שגיאת 400 (Bad Request) במקרה של כשל בוולידציה של המודל
    res.status(400).json({ message: err.message });
  }
};

// ============================================
// עדכון פריט קיים
// ============================================
// PUT update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // בדיקת הרשאות (Authorization) - רק المוכרת המקורית או מנהלת (admin) מורשות לערוך
    if (product.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit your own items' });
    }

    // מניעת שינוי שדות שמורים כמו סטטוס או זהות המוכרת
    delete req.body.sellerId;
    delete req.body.status;

    // עדכון השדות החדשים על גבי האובייקט ושמירה מחודשת ב-MongoDB
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ============================================
// מחיקת פריט מהחנות
// ============================================
// DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // בדיקת הרשאות מחיקה
    if (product.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own items' });
    }

    // בדיקת לוגיקה עסקית - מוצר שכבר נמכר לא ניתן למחוק מכיוון שיש הזמנה שקשורה אליו
    if (product.status === 'sold') {
      return res.status(400).json({ message: 'Sold items cannot be deleted' });
    }

    // מחיקת הדוקומנט מתוך קולקשן המוצרים
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};