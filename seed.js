require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User     = require('./models/User');
const Product  = require('./models/Product');
const Order    = require('./models/Order');
const Favorite = require('./models/Favorite');
const Message  = require('./models/Message');

const { CATEGORIES, SIZES, CONDITIONS } = require('./public/js/categories');

// ---------- helpers ----------
const pick   = arr => arr[Math.floor(Math.random() * arr.length)];
const rand   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// A random date within the last N months
function dateWithinMonths(months) {
  const now = Date.now();
  const past = now - months * 30 * 24 * 60 * 60 * 1000;
  return new Date(rand(past, now));
}

const CITIES = ['חיפה', 'תל אביב', 'ירושלים', 'רמת גן', 'נתניה',
                'באר שבע', 'חדרה', 'כפר סבא', 'רעננה', 'טירת כרמל'];

const BRANDS = ['Zara', 'H&M', 'Mango', 'Castro', 'Nike', 'Adidas',
                'Massimo Dutti', 'Stradivarius', 'Pull&Bear', 'No brand'];

const COLORS = ['Black', 'White', 'Blue', 'Beige', 'Green',
                'Pink', 'Grey', 'Brown', 'Red'];

// ---------- users ----------
async function createUsers() {
  const hash = await bcrypt.hash('User123', 10);
  const adminHash = await bcrypt.hash('Admin123', 10);

  const names = ['Noa Levi', 'Maya Cohen', 'Tamar Azulay', 'Shira Mizrahi',
                 'Yael Barak', 'Adi Peretz', 'Roni Shani', 'Lior Dayan',
                 'Gali Amar', 'Hila Nissim', 'Dana Segal'];

  const users = names.map((name, i) => ({
    name,
    email: `user${i + 1}@rewear.com`,
    password: hash,
    role: 'user',
    points: rand(0, 600),
    city: pick(CITIES),
    phone: `05${rand(0, 9)}-${rand(1000000, 9999999)}`
  }));

  // Two fixed accounts we all know by heart
  users.push({
    name: 'Admin',
    email: 'admin@rewear.com',
    password: adminHash,
    role: 'admin',
    points: 0,
    city: 'תל אביב',
    phone: '050-0000000'
  });

  users.unshift({
    name: 'Noa Demo',
    email: 'noa@rewear.com',
    password: hash,
    role: 'user',
    points: 500,
    city: 'חיפה',
    phone: '052-1234567'
  });

  const created = await User.insertMany(users);
  console.log(`✔ ${created.length} users created`);
  return created;

  
}
// ---------- products ----------
function randomTypeFor(gender, category) {
  const types = Object.keys(CATEGORIES[gender].categories[category].types);
  return pick(types);
}

function sizesFor(gender, category) {
  if (gender === 'kids') {
    return category === 'shoes' ? SIZES.kidsShoes : SIZES.kidsClothing;
  }
  if (category === 'shoes')       return SIZES.shoes;
  if (category === 'accessories') return SIZES.accessories;
  return SIZES.clothing;
}

async function createProducts(users) {
  const genders    = ['women', 'women', 'women', 'men', 'kids']; // women weighted
  const categories = ['clothing', 'clothing', 'shoes', 'accessories'];
  const conditions = Object.keys(CONDITIONS);

  const products = [];

  for (let i = 0; i < 60; i++) {
    const gender   = pick(genders);
    const category = pick(categories);
    const type     = randomTypeFor(gender, category);
    const seller   = pick(users.filter(u => u.role === 'user'));
    const label    = CATEGORIES[gender].categories[category].types[type];
    const brand    = pick(BRANDS);
    const color    = pick(COLORS);

    products.push({
      title: `${color} ${label}`,
      description: `A lovely ${label.toLowerCase()} in great shape. Barely worn.`,
      price: rand(3, 40) * 10,
      brand,
      gender,
      category,
      type,
      size: pick(sizesFor(gender, category)),
      condition: pick(conditions),
      color,
      images: [`https://picsum.photos/seed/rewear${i}/600/600`],
      sellerId: seller._id,
      city: seller.city,
      status: 'available',
      views: rand(0, 180),
      createdAt: dateWithinMonths(6)
    });
  }

  const created = await Product.insertMany(products);
  console.log(`✔ ${created.length} products created`);
  return created;
}

// ---------- orders ----------
async function createOrders(users, products) {
  const orders = [];
  const buyers = users.filter(u => u.role === 'user');

  // The first 40 products get sold
  for (let i = 0; i < 40; i++) {
    const product = products[i];
    const buyer   = pick(buyers.filter(u =>
      u._id.toString() !== product.sellerId.toString()
    ));

    orders.push({
      buyerId: buyer._id,
      sellerId: product.sellerId,
      productId: product._id,
      price: product.price,
      pointsEarned: product.price,
      paymentMethod: Math.random() > 0.35 ? 'card' : 'points',
      cardLast4: Math.random() > 0.35 ? String(rand(1000, 9999)) : null,
      shippingCity: buyer.city,
      status: 'completed',
      createdAt: dateWithinMonths(6)
    });

    await Product.findByIdAndUpdate(product._id, { status: 'sold' });
  }

  const created = await Order.insertMany(orders);
  console.log(`✔ ${created.length} orders created`);
  return created;
}

// ---------- favorites ----------
async function createFavorites(users, products) {
  const favorites = [];
  const seen = new Set();
  const buyers = users.filter(u => u.role === 'user');

  while (favorites.length < 25) {
    const user    = pick(buyers);
    const product = pick(products);
    const key     = `${user._id}-${product._id}`;

    if (seen.has(key)) continue;         // the unique index would reject it
    seen.add(key);

    favorites.push({ userId: user._id, productId: product._id });
  }

  const created = await Favorite.insertMany(favorites);
  console.log(`✔ ${created.length} favorites created`);
}

// ---------- messages ----------
async function createMessages() {
  const messages = [
    { name: 'Sarah Klein', email: 'sarah@example.com',
      subject: 'Question about shipping',
      body: 'Hi, how long does delivery usually take?' },
    { name: 'Michael Ross', email: 'michael@example.com',
      subject: 'Points system',
      body: 'Can I use my points together with a credit card?' },
    { name: 'Tal Nir', email: 'tal@example.com',
      subject: 'Great site!',
      body: 'Just wanted to say I love the concept. Keep it up.' }
  ];

  const created = await Message.insertMany(messages);
  console.log(`✔ ${created.length} messages created`);
}

// ---------- main ----------
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}),
      Favorite.deleteMany({}), Message.deleteMany({})
    ]);
    console.log('✔ Database cleared');

    const users    = await createUsers();
    const products = await createProducts(users);
    await createOrders(users, products);
    await createFavorites(users, products);
    await createMessages();

    console.log('\n🎉 Seed complete!');
    console.log('   admin@rewear.com / Admin123');
    console.log('   noa@rewear.com   / User123\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();