const Counter = require('../models/Counter');

async function getNextSequence(key) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

async function nextInvoiceNumber(year) {
  const y = year || new Date().getFullYear();
  const seq = await getNextSequence(`invoice_${y}`);
  return `INV-${y}-${String(seq).padStart(6, '0')}`;
}

async function nextPurchaseNumber() {
  const seq = await getNextSequence('purchase');
  return `PUR-${String(seq).padStart(6, '0')}`;
}

module.exports = { getNextSequence, nextInvoiceNumber, nextPurchaseNumber };