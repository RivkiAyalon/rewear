require('../models/User');
const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'available' })
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 12)
      .populate('sellerId', 'name city');

    const total = await Product.countDocuments({ status: 'available' });
    res.json({ products, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};