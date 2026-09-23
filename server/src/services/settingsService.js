const Setting = require('../models/Setting');

const DEFAULTS = {
  shopName: 'Mathi Collections',
  address: '',
  phone: '',
  email: '',
  gstin: '',
  invoicePrefix: 'INV',
  currency: 'INR',
  logo: '',
  defaultPaymentMethod: 'Cash',
  receiptSize: '80mm',
  autoPrint: true,
  allowNegativeStock: false,
  returnPolicy: 'Items can be returned within 7 days with the original bill.',
  invoiceFooter: 'Thank you for shopping with Mathi Collections!',
  loyaltyPointsPerRupee: 100,
  loyaltyRupeePerPoint: 1,
  loyaltyMinRedemption: 100,
  taxRate: 0,
};

async function getSettings() {
  let doc = await Setting.findOne({ key: 'app' });
  if (!doc) {
    doc = await Setting.create({ key: 'app', value: DEFAULTS });
  }
  return { ...DEFAULTS, ...doc.value };
}

async function updateSettings(patch, userId) {
  const merged = { ...DEFAULTS, ...(await getSettings()), ...patch };
  await Setting.findOneAndUpdate(
    { key: 'app' },
    { value: merged, updatedBy: userId },
    { new: true, upsert: true }
  );
  return merged;
}

module.exports = { getSettings, updateSettings, DEFAULTS };