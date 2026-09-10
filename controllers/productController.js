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