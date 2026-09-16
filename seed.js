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


// ============================================
// תמונות
// ============================================
// כל התמונות מאוחסנות בחשבון Cloudinary שלנו.
// היתרון על שירות חיצוני: הן לעולם לא נשברות.
//
// לכל type מ-categories.js יש כאן רשימת שמות קבצים.
// חשוב: ה-seed מייצר מוצרים רק בקטגוריות שמופיעות כאן,
// כדי שלא ייווצר מוצר עם תמונה שלא מתאימה לו.
// ============================================

const CLOUD_BASE = 'https://res.cloudinary.com/bcs2gb7g/image/upload';
const IMG_EXT = 'avif';

const IMAGE_SETS = {
  // ---- בגדי נשים ----
  dresses:  ['dress1', 'dress2', 'dress3'],
  skirts:   ['skirt1', 'skirt2', 'skirt3'],
  tops:     ['blouse1', 'blouse2', 'blouse3'],
  pants:    ['jeans1', 'jeans2', 'jeans3'],
  knitwear: ['sweater1', 'sweater2', 'sweater3'],
  jackets:  ['coat1', 'coat2', 'coat3'],

  // ---- נעליים ----
  sneakers: ['sneakers1', 'sneakers2', 'sneakers3'],
  heels:    ['high_heels1', 'high_heels2', 'high_heels3'],
  boots:    ['boots1', 'boots2', 'boots3'],
  sandals:  ['sandals1', 'sandals2', 'sandals3'],
  flats:    ['sandals1', 'sandals2', 'sandals3'],   // אין תמונות משלהן
  formal:   ['boots1', 'boots2', 'boots3'],

  // ---- אביזרים ----
  // שימו לב: התמונה השנייה נשמרה בשם 2handbag ולא handbag2
  bags:     ['handbag1', '2handbag', 'handbag3'],
  jewelry:  ['jewelry1', 'jewelry2', 'jewelry3'],
  // והשלישית של המשקפיים נשמרה בשם 3 בלבד
  glasses:  ['sunglasses1', 'sunglasses2', '3'],

  // ---- גברים ----
  shirts:   ['mens_shirt1', 'mens_shirt2', 'mens_shirt3'],
  suits:    ['mens_shirt1', 'mens_shirt2', 'mens_shirt3'],

  // ---- ילדים ----
  girls:      ['kids_clothes1', 'kids_clothes2', 'kids_clothes3'],
  boys:       ['kids_clothes1', 'kids_clothes2', 'kids_clothes3'],
  baby:       ['kids_clothes1', 'kids_clothes2', 'kids_clothes3'],
  costumes:   ['kids_clothes1', 'kids_clothes2', 'kids_clothes3'],
  girlsShoes: ['sneakers1', 'sneakers2', 'sneakers3'],
  boysShoes:  ['sneakers1', 'sneakers2', 'sneakers3'],

  // ---- ברירת מחדל ----
  // רשת ביטחון בלבד. בפועל הקוד לא אמור להגיע לכאן,
  // כי randomTypeWithImages בוחר רק types שיש להם תמונות.
  default:  ['default1', 'default2', 'default3']
};

function imageFor(type, seed) {
  const set  = IMAGE_SETS[type] || IMAGE_SETS.default;
  const name = set[seed % set.length];
  return `${CLOUD_BASE}/${name}.${IMG_EXT}`;
}


// ============================================
// משתמשות
// ============================================
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


// ============================================
// מוצרים
// ============================================

// מחזירה type אקראי מתוך אלה שיש להם תמונות ב-IMAGE_SETS.
// ככה לא נוצר מוצר עם תמונה גנרית שלא מתאימה לו.
// אם אין אף type מתאים בקטגוריה — מחזירה null,
// והלולאה תנסה שוב עם צירוף אחר.
function randomTypeWithImages(gender, category) {
  const all = Object.keys(CATEGORIES[gender].categories[category].types);
  const withImages = all.filter(t => IMAGE_SETS[t]);
  return withImages.length ? pick(withImages) : null;
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
  const sellers    = users.filter(u => u.role === 'user');

  const products = [];
  let i = 0;

  // ממשיכים עד שיש 140 מוצרים.
  // אם צירוף מגדר+קטגוריה לא מניב type עם תמונות,
  // פשוט מנסים צירוף אחר.
  while (products.length < 140) {
    const gender   = pick(genders);
    const category = pick(categories);
    const type     = randomTypeWithImages(gender, category);

    if (!type) continue;

    const seller = pick(sellers);
    const label  = CATEGORIES[gender].categories[category].types[type];
    const brand  = pick(BRANDS);
    const color  = pick(COLORS);

    // בין אחת לשלוש תמונות לכל מוצר,
    // כדי שהגלריה בעמוד המוצר תהיה עם מה לעבוד
    const imageCount = rand(1, 3);
    const images = [];
    for (let n = 0; n < imageCount; n++) {
      images.push(imageFor(type, i + n));
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

    i++;
  }

  const created = await Product.insertMany(products);
  console.log(`✔ ${created.length} products created`);
  return created;
}


// ============================================
// הזמנות
// ============================================
async function createOrders(users, products) {
  const orders = [];
  const buyers = users.filter(u => u.role === 'user');

  // 90 המוצרים הראשונים נמכרים, 50 נשארים בחנות
  for (let i = 0; i < 90; i++) {
    const product = products[i];
    const buyer   = pick(buyers.filter(u =>
      u._id.toString() !== product.sellerId.toString()
    ));

    const byCard = Math.random() > 0.35;

    // כ-8% מההזמנות בוטלו — כדי שיהיה מה לסנן
    // ב-Aggregate שמחשב רק completed
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


// ============================================
// מועדפים
// ============================================
async function createFavorites(users, products) {
  const favorites = [];
  const seen = new Set();
  const buyers = users.filter(u => u.role === 'user');

  while (favorites.length < 70) {
    const user    = pick(buyers);
    const product = pick(products);
    const key     = `${user._id}-${product._id}`;

    // האינדקס הייחודי במודל היה דוחה כפילות,
    // אז מונעים אותה מראש
    if (seen.has(key)) continue;
    seen.add(key);

    favorites.push({ userId: user._id, productId: product._id });
  }

  const created = await Favorite.insertMany(favorites);
  console.log(`✔ ${created.length} favorites created`);
}


// ============================================
// הודעות מטופס יצירת קשר
// ============================================
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


// ============================================
// ריצה
// ============================================
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // מוחקים הכל ובונים מחדש, כדי שכל אחת
    // תוכל לאפס למצב ידוע
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