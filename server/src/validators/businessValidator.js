const { z } = require('zod');

const id = z.string().refine((v) => /^[0-9a-fA-F]{24}$/.test(v), 'Invalid id');

const paymentEntrySchema = z.object({
  method: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit']),
  amount: z.coerce.number().min(0),
  reference: z.string().optional().nullable(),
});

const saleItemSchema = z.object({
  variant: id,
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
});

const saleCreateSchema = z.object({
  customer: id.optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  billDiscountType: z.enum(['PERCENT', 'FIXED']).optional(),
  billDiscountValue: z.coerce.number().min(0).optional(),
  couponCode: z.string().optional().nullable(),
  payments: z.array(paymentEntrySchema).optional(),
  notes: z.string().optional().nullable(),
  redeemPoints: z.coerce.number().min(0).optional(),
  status: z.enum(['COMPLETED', 'HELD']).optional(),
  dueDate: z.string().optional().nullable(),
});

const purchaseItemSchema = z.object({
  variant: id,
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
});

const purchaseCreateSchema = z.object({
  supplier: id,
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  discount: z.coerce.number().min(0).optional(),
  paidAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const expenseSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  category: z.enum([
    'Rent',
    'Electricity',
    'Salary',
    'Internet',
    'Transport',
    'Maintenance',
    'Marketing',
    'Packaging',
    'Other',
  ]),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit']).optional(),
  description: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
});

const couponSchema = z.object({
  code: z.string().min(2),
  discountType: z.enum(['PERCENT', 'FIXED']).default('PERCENT'),
  discountValue: z.coerce.number().positive(),
  minimumAmount: z.coerce.number().min(0).optional(),
  maximumDiscount: z.coerce.number().min(0).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  usageLimit: z.coerce.number().min(0).optional(),
  active: z.boolean().optional(),
});

const salesReturnSchema = z.object({
  sale: id,
  items: z
    .array(
      z.object({
        saleItem: id.optional().nullable(),
        variant: id,
        quantity: z.coerce.number().min(1),
      })
    )
    .min(1, 'Select at least one item to return'),
  reason: z.enum(['Size Issue', 'Color Issue', 'Defective', 'Customer Request', 'Wrong Product', 'Other']),
  action: z.enum(['REFUND', 'STORE_CREDIT', 'EXCHANGE']).optional(),
  paymentMethod: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

const purchaseReturnSchema = z.object({
  purchase: id,
  items: z.array(
    z.object({
      purchaseItem: id.optional().nullable(),
      variant: id,
      quantity: z.coerce.number().min(1),
    })
  ).min(1),
  reason: z.string().min(1),
  note: z.string().optional().nullable(),
});

module.exports = {
  saleCreateSchema,
  purchaseCreateSchema,
  expenseSchema,
  couponSchema,
  salesReturnSchema,
  purchaseReturnSchema,
};