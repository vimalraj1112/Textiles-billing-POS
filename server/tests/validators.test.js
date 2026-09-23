const { describe, it } = require('node:test');
const { strictEqual, ok } = require('node:assert');
const {
  saleCreateSchema,
  purchaseCreateSchema,
  expenseSchema,
  couponSchema,
  salesReturnSchema,
} = require('../src/validators/businessValidator');

const VALID_ID = '6ab2975eee5e6cce25f8e288';

describe('business validators', () => {
  it('accepts a valid sale payload with number-like strings', () => {
    const out = saleCreateSchema.parse({
      customer: VALID_ID,
      items: [{ variant: VALID_ID, quantity: '2', unitPrice: '899' }],
      payments: [{ method: 'Cash', amount: '1798' }],
      billDiscountType: 'FIXED',
    });
    strictEqual(out.items[0].quantity, 2);
    strictEqual(out.items[0].unitPrice, 899);
    strictEqual(out.payments[0].amount, 1798);
  });

  it('rejects a sale with empty items', () => {
    ok(!saleCreateSchema.safeParse({ items: [] }).success);
  });

  it('rejects a sale with invalid payment method', () => {
    const r = saleCreateSchema.safeParse({
      items: [{ variant: VALID_ID, quantity: 1 }],
      payments: [{ method: 'Bitcoin', amount: 10 }],
    });
    ok(!r.success);
  });

  it('accepts a valid purchase and normalizes numbers', () => {
    const out = purchaseCreateSchema.parse({
      supplier: VALID_ID,
      items: [{ variant: VALID_ID, quantity: 10, unitPrice: 550 }],
      paidAmount: '5500',
      paymentMethod: 'Bank Transfer',
    });
    strictEqual(out.items[0].quantity, 10);
    strictEqual(out.paidAmount, 5500);
  });

  it('rejects a purchase without supplier or items', () => {
    ok(!purchaseCreateSchema.safeParse({ items: [{ variant: VALID_ID, quantity: 1, unitPrice: 5 }] }).success);
    ok(!purchaseCreateSchema.safeParse({ supplier: VALID_ID, items: [] }).success);
  });

  it('validates the expense category enum and positive amount', () => {
    const good = expenseSchema.parse({ title: 'Rent', category: 'Rent', amount: '12000' });
    strictEqual(good.amount, 12000);
    ok(!expenseSchema.safeParse({ title: 'x', category: 'Petrol', amount: 10 }).success);
    ok(!expenseSchema.safeParse({ title: 'x', category: 'Rent', amount: 0 }).success);
  });

  it('validates the coupon schema and defaults discountType', () => {
    const out = couponSchema.parse({ code: 'SAVE10', discountValue: 10 });
    strictEqual(out.discountType, 'PERCENT');
  });

  it('validates sales return items require sale and variant', () => {
    const good = salesReturnSchema.parse({
      sale: VALID_ID,
      items: [{ variant: VALID_ID, quantity: 1 }],
      reason: 'Size Issue',
    });
    strictEqual(good.items[0].variant, VALID_ID);
    ok(!salesReturnSchema.safeParse({ items: [{ variant: VALID_ID, quantity: 1 }], reason: 'Size Issue' }).success);
  });
});