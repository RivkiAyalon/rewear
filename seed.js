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
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// תאריך אקראי בתוך N החודשים האחרונים
function dateWithinMonths(months) {
  const now = Date.now();
  const past = now - months * 30 * 24 * 60 * 60 * 1000;
  return new Date(rand(past, now));
}

const CITIES = ['חיפה', 'תל אביב', 'ירושלים', 'רמת גן', 'נתניה',
                'באר שבע', 'חדרה', 'כפר סבא', 'רעננה', 'טירת כרמל',
                'פתח תקווה', 'ראשון לציון', 'אשדוד', 'הרצליה', 'מודיעין'];

const BRANDS = ['Zara', 'H&M', 'Mango', 'Castro', 'Nike', 'Adidas',
                'Massimo Dutti', 'Stradivarius', 'Pull&Bear', 'Bershka',
                'COS', '& Other Stories', 'Levi\'s', 'Renuar', 'No brand'];

const COLORS = ['Black', 'White', 'Blue', 'Beige', 'Green', 'Navy',
                'Pink', 'Grey', 'Brown', 'Red', 'Cream', 'Olive'];



function imageFor(type, seed) {
  return `https://picsum.photos/seed/${type}${seed}/600/600`;
}

// ---------- users ----------
async function createUsers() {
  const hash = await bcrypt.hash('User123', 10);
  const adminHash = await bcrypt.hash('Admin123', 10);

  const names = [
    'Noa Levi', 'Maya Cohen', 'Tamar Azulay', 'Shira Mizrahi',
    'Yael Barak', 'Adi Peretz', 'Roni Shani', 'Lior Dayan',
    'Gali Amar', 'Hila Nissim', 'Dana Segal', 'Michal Katz',
    'Avigail Ronen', 'Sivan Gabay', 'Efrat Tal', 'Noam Harel',
    'Daniel Shviro', 'Omer Regev', 'Itay Barzilai', 'Yonatan Adler',
    'Ruth Ben-David', 'Talia Weiss', 'Naama Sharon', 'Eden Malka'
  ];

  const users = names.map((name, i) => ({
    name,
    email: `user${i + 1}@rewear.com`,
    password: hash,
    role: 'user',
    points: rand(0, 900),
    city: pick(CITIES),
    phone: `05${rand(0, 9)}-${rand(1000000, 9999999)}`
  }));

  // שני החשבונות הקבועים שכולנו מכירות בעל פה
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
  // נשים מופיעות יותר, כמו במרקטפלייס אמיתי
  const genders    = ['women', 'women', 'women', 'women', 'men', 'men', 'kids'];
  const categories = ['clothing', 'clothing', 'clothing', 'shoes', 'accessories'];
  const conditions = Object.keys(CONDITIONS);

  const products = [];

  for (let i = 0; i < 140; i++) {
    const gender   = pick(genders);
    const category = pick(categories);
    const type     = randomTypeFor(gender, category);
    const seller   = pick(users.filter(u => u.role === 'user'));
    const label    = CATEGORIES[gender].categories[category].types[type];
    const brand    = pick(BRANDS);
    const color    = pick(COLORS);

    // בין אחת לשלוש תמונות לכל מוצר
    const imageCount = rand(1, 3);
    const images = [];
    for (let n = 0; n < imageCount; n++) {
      images.push(imageFor(type, i * 10 + n));
    }

    products.push({
      title: `${color} ${label}`,
      description: `A lovely ${label.toLowerCase()} by ${brand}. ` +
                   `Barely worn and in great shape. From a smoke-free home.`,
      price: rand(3, 60) * 10,
      brand,
      gender,
      category,
      type,
      size: pick(sizesFor(gender, category)),
      condition: pick(conditions),
      color,
      images,
      sellerId: seller._id,
      city: seller.city,
      status: 'available',
      views: rand(0, 320),
      createdAt: dateWithinMonths(8)
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

  // 90 מוצרים ראשונים נמכרים, 50 נשארים בחנות
  for (let i = 0; i < 90; i++) {
    const product = products[i];
    const buyer   = pick(buyers.filter(u =>
      u._id.toString() !== product.sellerId.toString()
    ));

    const byCard = Math.random() > 0.35;

    // כ-8% מההזמנות בוטלו — כדי שיהיה מה להראות
    // ב-Aggregate שמסנן רק completed
    const cancelled = Math.random() < 0.08;

    orders.push({
      buyerId: buyer._id,
      sellerId: product.sellerId,
      productId: product._id,
      price: product.price,
      pointsEarned: product.price,
      paymentMethod: byCard ? 'card' : 'points',
      cardLast4: byCard ? String(rand(1000, 9999)) : null,
      shippingCity: buyer.city,
      status: cancelled ? 'cancelled' : 'completed',
      createdAt: dateWithinMonths(8)
    });

    // הזמנה שבוטלה מחזירה את המוצר לחנות
    if (!cancelled) {
      await Product.findByIdAndUpdate(product._id, { status: 'sold' });
    }
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

  while (favorites.length < 70) {
    const user    = pick(buyers);
    const product = pick(products);
    const key     = `${user._id}-${product._id}`;

    if (seen.has(key)) continue;   // האינדקס הייחודי היה דוחה כפילות
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
      subject: 'Question about pickup',
      body: 'Hi, how do I arrange pickup after I buy something?' },
    { name: 'Michael Ross', email: 'michael@example.com',
      subject: 'Points system',
      body: 'Can I use my points together with a credit card?' },
    { name: 'Tal Nir', email: 'tal@example.com',
      subject: 'Great site!',
      body: 'Just wanted to say I love the concept. Keep it up.' },
    { name: 'Dana Levi', email: 'dana@example.com',
      subject: 'Wrong size',
      body: 'The item I got is smaller than listed. What can I do?' },
    { name: 'Amit Golan', email: 'amit@example.com',
      subject: 'Selling question',
      body: 'How many items can I list at once?' },
    { name: 'Rotem Bar', email: 'rotem@example.com',
      subject: 'Account',
      body: 'I would like to change the email on my account.' }
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