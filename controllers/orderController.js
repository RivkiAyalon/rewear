const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const { productId, paymentMethod, cardLast4, shippingCity } = req.body;

    // 1. Claim the product only if it is still available
    const product = await Product.findOneAndUpdate(
      { _id: productId, status: 'available' },
      { status: 'sold' },
      { new: true }
    );

    if (!product) {
      return res.status(409).json({
        message: 'This item is no longer available'
      });
    }

    // 2. Cannot buy your own item
    if (product.sellerId.toString() === req.user.id) {
      await Product.findByIdAndUpdate(
        product._id,
        { status: 'available' }
      );

      return res.status(400).json({
        message: 'You cannot buy your own item'
      });
    }

    // 3. Pay with points
    if (paymentMethod === 'points') {
      const buyer = await User.findOneAndUpdate(
        {
          _id: req.user.id,
          points: { $gte: product.price }
        },
        {
          $inc: { points: -product.price }
        },
        { new: true }
      );

      if (!buyer) {
        await Product.findByIdAndUpdate(
          product._id,
          { status: 'available' }
        );

        return res.status(402).json({
          message: 'Not enough points'
        });
      }
    }

    // 4. Give the seller points
    await User.findByIdAndUpdate(
      product.sellerId,
      { $inc: { points: product.price } }
    );

    // 5. Create the order
    const order = await Order.create({
      buyerId: req.user.id,
      sellerId: product.sellerId,
      productId: product._id,
      price: product.price,
      pointsEarned: product.price,
      paymentMethod,
      cardLast4: cardLast4 || null,
      shippingCity,
      status: 'completed'
    });

    const buyer = await User.findById(req.user.id);

    res.status(201).json({
      order,
      points: buyer.points
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id
    })
      .sort({ createdAt: -1 })
      .populate('productId', 'title images price')
      .populate('sellerId', 'name city');

    res.json(orders);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
exports.getMySales = async (req, res) => {
  try {
    const sales = await Order.find({
      sellerId: req.user.id
    })
      .sort({ createdAt: -1 })
      .populate('productId', 'title images price')
      .populate('buyerId', 'name city');

    res.json(sales);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};