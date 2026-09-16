const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    // כמה מוצרים והזמנות לכל משתמשת
    const withStats = await Promise.all(users.map(async u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      points: u.points,
      city: u.city,
      createdAt: u.createdAt,
      products: await Product.countDocuments({ sellerId: u._id }),
      orders:   await Order.countDocuments({ buyerId: u._id })
    })));

    res.json(withStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changeRole = async (req, res) => {

  try {
    
    const { role } = req.body || {};

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // מנהלת לא יכולה להוריד את עצמה
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, { role }, { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ _id: user._id, name: user.name, role: user.role });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // מוחקים גם את המוצרים שלה שעדיין למכירה
    await Product.deleteMany({ sellerId: user._id, status: 'available' });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('productId', 'title images city')
      .populate('buyerId',  'name email phone city')
      .populate('sellerId', 'name email phone city');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// מחזירה את הנתונים המרכזיים שיוצגו בלוח הבקרה של המנהלת.
exports.getStats = async (req, res) => {
  try {
    // מריצים את כל השאילתות במקביל כדי לחסוך זמן.
    const [users, products, orders, revenue] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: 'available' }),
      Order.countDocuments({ status: 'completed' }),

      // מחשבים את סך ההכנסות מכל ההזמנות שהושלמו.
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    res.json({
      users,
      products,
      orders,
      revenue: revenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};