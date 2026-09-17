require('../models/User');
const Product = require('../models/Product');

// GET all products
exports.getProducts = async (req, res) => {
  try {
    const { search, sort, page = 1 } = req.query;
    const filter = { status: 'available' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    ['gender', 'category', 'type', 'size', 'condition', 'brand', 'city']
      .forEach(f => {
        if (req.query[f]) {
          filter[f] = req.query[f];
        }
      });

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};

      if (req.query.minPrice) {
        filter.price.$gte = Number(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        filter.price.$lte = Number(req.query.maxPrice);
      }
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      popular: { views: -1 }
    };

    const limit = Number(req.query.limit) || 12;
    const pageNumber = Number(page) || 1;

    const products = await Product.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .populate('sellerId', 'name city');

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      total,
      pages: Math.ceil(total / limit)
    });

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
    res.status(404).json({ message: 'Product not found' });
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

    // שדות שהלקוח לא רשאי לקבוע — נזרקים לפני היצירה
    delete req.body.status;
    delete req.body.views;
    delete req.body.sellerId;

    
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
// PUT update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit your own items' });
    }

    delete req.body.sellerId;
    delete req.body.status;

    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own items' });
    }

    // מוצר שנמכר לא נמחק — יש הזמנה שמצביעה עליו
    if (product.status === 'sold') {
      return res.status(400).json({ message: 'Sold items cannot be deleted' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
