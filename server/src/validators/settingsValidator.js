const { z } = require('zod');

const settingsSchema = z.object({
  shopName: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  invoicePrefix: z.string().optional().nullable(),
  currency: z.string().optional(),
  logo: z.string().optional().nullable(),
  defaultPaymentMethod: z.string().optional(),
  receiptSize: z.enum(['58mm', '80mm', 'A4']).optional(),
  autoPrint: z.boolean().optional(),
  allowNegativeStock: z.boolean().optional(),
  returnPolicy: z.string().optional().nullable(),
  invoiceFooter: z.string().optional().nullable(),
  loyaltyPointsPerRupee: z.coerce.number().min(0).optional(),
  loyaltyRupeePerPoint: z.coerce.number().min(0).optional(),
  loyaltyMinRedemption: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
});

module.exports = { settingsSchema };