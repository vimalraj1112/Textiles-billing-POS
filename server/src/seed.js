require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('./config/env');
const { ROLES } = require('./constants');
const { DEFAULT_CATEGORIES, DEFAULT_SIZES, DEFAULT_COLORS } = require('./constants');

const User = require('./models/User');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
const Size = require('./models/Size');
const Color = require('./models/Color');
const Product = require('./models/Product');
const ProductVariant = require('./models/ProductVariant');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Setting = require('./models/Setting');
const { DEFAULTS } = require('./services/settingsService');

// Dev-only default credentials. Change in production.
const SEED_ADMIN = {
  name: 'Mathi Admin',
  email: 'admin@example.com',
  password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
  phone: '9876543210',
  role: ROLES.ADMIN,
};

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`[seed] connected: ${env.MONGODB_URI}`);

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Size.deleteMany({}),
    Color.deleteMany({}),
    Product.deleteMany({}),
    ProductVariant.deleteMany({}),
    Customer.deleteMany({}),
    Supplier.deleteMany({}),
    Setting.deleteMany({}),
  ]);
  console.log('[seed] cleared existing data');

  const admin = await User.create(SEED_ADMIN);
  console.log(`[seed] admin created: admin@example.com / ${SEED_ADMIN.password} (DEV ONLY)`);

  const categories = [];
  for (const name of DEFAULT_CATEGORIES) {
    categories.push(await Category.create({ name }));
  }
  const cat = (n) => categories.find((c) => c.name === n);

  const sizes = [];
  let so = 0;
  for (const name of DEFAULT_SIZES) {
    sizes.push(await Size.create({ name, sortOrder: so++ }));
  }
  const size = (n) => sizes.find((s) => s.name === n);

  const colors = [];
  for (const c of DEFAULT_COLORS) {
    colors.push(await Color.create(c));
  }
  const color = (n) => colors.find((c) => c.name === n);

  const brandN = await Brand.create({ name: 'Mathi Exclusive', description: 'In-house brand' });

  const supplier1 = await Supplier.create({
    name: 'Chennai Textile Hub',
    companyName: 'Chennai Textile Hub Pvt Ltd',
    phone: '044-2345-6789',
    email: 'sales@chennaitextilehub.in',
    city: 'Chennai',
    state: 'Tamil Nadu',
    gstNumber: '33AAAAA0000A1Z5',
  });
  const supplier2 = await Supplier.create({
    name: 'Silk World Coimbatore',
    companyName: 'Silk World Pvt Ltd',
    phone: '0422-1234567',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    gstNumber: '33BBBBB0000B1Z5',
  });

  const customers = [
    { name: 'Priya Sharma', phone: '9840012345', city: 'Coimbatore', state: 'Tamil Nadu' },
    { name: 'Ramesh Kumar', phone: '9940023456', city: 'Erode', state: 'Tamil Nadu' },
    { name: 'Kavitha Ravi', phone: '8840034567', city: 'Chennai', state: 'Tamil Nadu' },
    { name: 'Deepak Anand', phone: '7780045678', city: 'Salem', state: 'Tamil Nadu' },
    { name: 'Lakshmi Narayanan', phone: '9650056789', city: 'Coimbatore', state: 'Tamil Nadu' },
  ];
  for (const c of customers) await Customer.create(c);
  console.log(`[seed] created ${customers.length} customers`);

  const products = [
    {
      name: 'Anarkali Kurti',
      category: 'Kurtis',
      brand: brandN._id,
      material: 'Cotton',
      gender: 'Female',
      purchasePrice: 550,
      sellingPrice: 899,
      minimumStock: 5,
      supplier: supplier1._id,
      colors: ['Pink', 'Blue'],
      sizes: ['S', 'M', 'L', 'XL'],
      skuPrefix: 'KRT-ANK',
    },
    {
      name: 'Cotton Saree',
      category: 'Sarees',
      brand: brandN._id,
      material: 'Cotton',
      gender: 'Female',
      purchasePrice: 1200,
      sellingPrice: 1999,
      minimumStock: 4,
      supplier: supplier2._id,
      colors: ['Red', 'Green', 'Yellow'],
      sizes: ['Free Size'],
      skuPrefix: 'SAR-COT',
    },
    {
      name: 'Silk Saree',
      category: 'Sarees',
      brand: brandN._id,
      material: 'Silk',
      gender: 'Female',
      purchasePrice: 3500,
      sellingPrice: 5499,
      minimumStock: 3,
      supplier: supplier2._id,
      colors: ['Purple', 'Orange', 'Blue'],
      sizes: ['Free Size'],
      skuPrefix: 'SAR-SLK',
    },
    {
      name: 'Chudidar Set',
      category: 'Chudidars',
      brand: brandN._id,
      material: 'Cotton',
      gender: 'Female',
      purchasePrice: 620,
      sellingPrice: 999,
      minimumStock: 5,
      supplier: supplier1._id,
      colors: ['Green', 'Black'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      skuPrefix: 'CHD-ST',
    },
    {
      name: "Men's Formal Shirt",
      category: 'Shirts',
      brand: brandN._id,
      material: 'Cotton',
      gender: 'Male',
      purchasePrice: 480,
      sellingPrice: 799,
      minimumStock: 6,
      supplier: supplier1._id,
      colors: ['White', 'Blue'],
      sizes: ['S', 'M', 'L', 'XL'],
      skuPrefix: 'SHT-FM',
    },
    {
      name: 'Cotton T-Shirt',
      category: 'T-Shirts',
      brand: brandN._id,
      material: 'Cotton',
      gender: 'Unisex',
      purchasePrice: 180,
      sellingPrice: 349,
      minimumStock: 10,
      supplier: supplier1._id,
      colors: ['Black', 'White', 'Grey', 'Red'],
      sizes: ['M', 'L', 'XL', 'XXL'],
      skuPrefix: 'TSH-COT',
    },
    {
      name: 'Kids Frock',
      category: 'Kids Wear',
      brand: brandN._id,
      material: 'Cotton',
      gender: 'Kids',
      purchasePrice: 320,
      sellingPrice: 549,
      minimumStock: 6,
      supplier: supplier1._id,
      colors: ['Pink', 'Yellow'],
      sizes: ['S', 'M', 'L'],
      skuPrefix: 'KID-FRK',
    },
    {
      name: 'Designer Lehenga',
      category: 'Lehengas',
      brand: brandN._id,
      material: 'Silk',
      gender: 'Female',
      purchasePrice: 4500,
      sellingPrice: 6999,
      minimumStock: 2,
      supplier: supplier2._id,
      colors: ['Red', 'Purple'],
      sizes: ['S', 'M', 'L'],
      skuPrefix: 'LHN-DGN',
    },
    {
      name: 'Slim Fit Jeans',
      category: 'Jeans',
      brand: brandN._id,
      material: 'Cotton',
      gender: 'Male',
      purchasePrice: 750,
      sellingPrice: 1199,
      minimumStock: 6,
      supplier: supplier1._id,
      colors: ['Blue', 'Black'],
      sizes: ['M', 'L', 'XL', 'XXL'],
      skuPrefix: 'JNS-SLM',
    },
    {
      name: 'Night Suit',
      category: 'Night Wear',
      brand: brandN._id,
      material: 'Cotton',
      gender: 'Female',
      purchasePrice: 280,
      sellingPrice: 499,
      minimumStock: 8,
      supplier: supplier1._id,
      colors: ['Pink', 'Blue', 'Green'],
      sizes: ['S', 'M', 'L', 'XL'],
      skuPrefix: 'NGT-ST',
    },
  ];

  let variantCount = 0;
  for (const p of products) {
    const catId = cat(p.category)?._id || cat('Other')._id;
    const product = await Product.create({
      name: p.name,
      category: catId,
      brand: p.brand,
      material: p.material,
      gender: p.gender,
      purchasePrice: p.purchasePrice * 100,
      sellingPrice: p.sellingPrice * 100,
      minimumStock: p.minimumStock,
      supplier: p.supplier,
      description: `${p.name} - premium quality fabric, perfect for every occasion.`,
      status: 'ACTIVE',
    });

    for (const colorName of p.colors) {
      for (const sizeName of p.sizes) {
        const sObj = size(sizeName);
        const cObj = color(colorName);
        const stock = Math.max(0, (variantCount * 7) % 25);
        const sku = `${p.skuPrefix}-${sizeName.toUpperCase().replace(' ', '')}-${colorName.toUpperCase()}`;
        await ProductVariant.create({
          product: product._id,
          size: sObj?._id,
          color: cObj?._id,
          sku,
          barcode: `89${String(100000 + variantCount * 37).padStart(10, '0')}`,
          purchasePrice: p.purchasePrice * 100,
          sellingPrice: p.sellingPrice * 100,
          stock,
          minimumStock: p.minimumStock,
          status: 'ACTIVE',
        });
        variantCount += 1;
      }
    }
    console.log(`[seed] product: ${p.name} (${p.colors.length * p.sizes.length} variants)`);
  }

  await Setting.create({ key: 'app', value: DEFAULTS });
  console.log('[seed] settings initialized: Mathi Collections');

  console.log(`[seed] done. Products: ${products.length}, variants: ${variantCount}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
