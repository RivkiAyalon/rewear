const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

// Creates a token that holds who the user is
function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Shapes the user object we send back — never includes the password
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

exports.register = async (req, res) => {
  try {
    const { name, email, password, city, phone } = req.body;

    if (!name || !email || !password || !city || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'This email is already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      city,
      phone
    });

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // צריך לבקש את הסיסמה במפורש, כי במודל היא select: false
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

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

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, city, phone } = req.body;

    // שדות שאסור לשנות דרך כאן: email, role, points, password
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, city, phone },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(publicUser(user));

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.getPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // מכירות — כאן צברה נקודות
    const sales = await Order.find({ sellerId: req.user.id, status: 'completed' })
      .sort({ createdAt: -1 })
      .populate('productId', 'title')
      .populate('buyerId', 'name');

    // קניות ששולמו בנקודות — כאן הוציאה
    const purchases = await Order.find({
      buyerId: req.user.id,
      status: 'completed',
      paymentMethod: 'points'
    })
      .sort({ createdAt: -1 })
      .populate('productId', 'title');

    const earned = sales.reduce((sum, o) => sum + o.pointsEarned, 0);
    const spent  = purchases.reduce((sum, o) => sum + o.price, 0);

    // מאחדים לרשימה אחת ממוינת לפי תאריך
    const history = [
      ...sales.map(o => ({
        type: 'earned',
        amount: o.pointsEarned,
        title: o.productId?.title || 'Item',
        date: o.createdAt
      })),
      ...purchases.map(o => ({
        type: 'spent',
        amount: o.price,
        title: o.productId?.title || 'Item',
        date: o.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ balance: user.points, earned, spent, history });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};