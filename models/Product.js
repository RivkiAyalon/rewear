// ייבוא ספריית Mongoose לניהול סכמות ומודלים מול בסיס הנתונים MongoDB
const mongoose = require('mongoose');

// הגדרת סכמת המוצר (Product Schema) - התבנית שקובעת את המבנה, השדות והוולידציות של כל מוצר
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'], // שדה חובה + הודעת שגיאה מותאמת
    trim: true                            // הסרת רווחים מיותרים בהתחלה ובסוף (Sanitization)
  },
  description: { type: String, trim: true },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']   // ולידציה יציבה ברמת המסד: מניעת מחיר שלילי
  },
  brand: {
    type: String,
    trim: true,
    default: 'No brand'                    // ערך ברירת מחדל במידה ולא הוגדר מותג
  },
  gender: {
    type: String,
    required: [true, 'Gender category is required'],
    enum: ['women', 'men', 'kids']         // הגבלת ערכים מותרים בלבד (Enumeration)
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['clothing', 'shoes', 'accessories']
  },
  type: {
    type: String,
    required: [true, 'Item type is required']
  },
  size: {
    type: String,
    required: [true, 'Size is required']
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['new-tags', 'new', 'excellent', 'very-good', 'good']
  },
  color: { type: String, trim: true },
  images: {
    type: [String],                        // מערך של מחרוזות טקסט המכיל את הקישורים לתמונות (Cloudinary URLs)
    validate: {
      validator: arr => arr.length > 0,   // ולידטור מותאם אישית (Custom Validator) לווידוא העלאת תמונה אחת לפחות
      message: 'At least one image is required'
    }
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId, // שמירת מזהה אובייקט ייחודי (Foreign Key)
    ref: 'User',                          // קישור (Reference) למודל User לצורך ביצוע populate
    required: true
  },
  city: { type: String, trim: true },
  status: {
    type: String,
    enum: ['available', 'sold'],          // סטטוס זמינות המוצר בחנות
    default: 'available'
  },
  views: { type: Number, default: 0 }     // מונה צפיות במוצר (משמש למיון לפי פופולריות בשרת)
}, { timestamps: true });                  // מוסיף אוטומטית שדות תאריך: createdAt ו-updatedAt

// אינדקסים (Indexes) — מזרזים את ביצוע השאילתות והסינון בחנות ברמת מסד הנתונים
productSchema.index({ gender: 1, category: 1, type: 1 }); // אינדקס משולב (Compound Index) לסינון מהיר לפי קטגוריות
productSchema.index({ status: 1, createdAt: -1 });         // אינדקס לסינון מוצרים זמינים ומיון מהחדש לישן

// ייצוא המודל בשם 'Product' לשימוש בקבצי ה-Controller וה-Seed
module.exports = mongoose.model('Product', productSchema);