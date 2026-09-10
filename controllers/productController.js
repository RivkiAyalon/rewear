require('../models/User');
const Product = require('../models/Product');

// GET all products
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

// GET single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('sellerId', 'name city phone');

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Product not found' });
  }
};

// GET my products
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create product
exports.createProduct = async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      sellerId: req.user.id
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};