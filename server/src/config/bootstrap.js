const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Size = require('../models/Size');
const Color = require('../models/Color');
const Setting = require('../models/Setting');
const { ROLES, DEFAULT_CATEGORIES, DEFAULT_SIZES, DEFAULT_COLORS } = require('../constants');
const { DEFAULTS } = require('../services/settingsService');
const env = require('./env');

async function ensureDefaults() {
  const counts = await Promise.all([
    Category.countDocuments(),
    Setting.countDocuments({ key: 'app' }),
  ]);
  const [categoryCount, settingCount] = counts;

  const email = (env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findOne({ email });
  if (existing) {
    existing.password = bcrypt.hashSync(password, 10);
    await existing.save();
    console.log(`[bootstrap] synced admin password for: ${email} (matches ADMIN_PASSWORD env)`);
  } else {
    await User.create({
      name: env.ADMIN_NAME || 'Mathi Admin',
      email,
      password: bcrypt.hashSync(password, 10),
      phone: '',
      role: ROLES.ADMIN,
    });
    console.log(`[bootstrap] created admin user: ${email} (password from ADMIN_PASSWORD env or default)`);
  }

  if (categoryCount === 0) {
    await Promise.all(DEFAULT_CATEGORIES.map((name) => Category.create({ name })));
    await Promise.all(DEFAULT_SIZES.map((name, i) => Size.create({ name, sortOrder: i })));
    await Promise.all(DEFAULT_COLORS.map((c) => Color.create(c)));
    await Brand.create({ name: 'General', description: 'Default brand' });
    console.log('[bootstrap] created default categories, sizes, colors and a placeholder brand');
  }

  if (settingCount === 0) {
    await Setting.create({ key: 'app', value: DEFAULTS });
    console.log('[bootstrap] initialized default settings');
  }
}

module.exports = { ensureDefaults };