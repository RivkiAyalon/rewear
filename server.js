require('dotenv').config();


const express  = require('express');
const mongoose = require('mongoose');
const path     = require('path');

const app = express();

// מאפשר לשרת לקרוא JSON שמגיע בגוף הבקשה
app.use(express.json());

// מגיש את קבצי ה-HTML, CSS ו-JS מתוך תיקיית public
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// חיבור ל-MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message));

// נתיב בדיקה — נמחק אותו בהמשך
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'ReWear server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));