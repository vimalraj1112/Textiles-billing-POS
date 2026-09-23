const { z } = require('zod');

const id = z.string().refine((v) => /^[0-9a-fA-F]{24}$/.test(v), 'Invalid id');

const variantInputSchema = z.object({
  size: id.nullable().optional(),
  color: id.nullable().optional(),
  sku: z.string().trim().optional().nullable(),
  barcode: z.string().trim().optional().nullable(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0).optional(),
  minimumStock: z.coerce.number().min(0).optional(),
});

const productCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().trim().optional().nullable(),
  category: id.optional().nullable(),
  subcategory: z.string().trim().optional().nullable(),
  brand: id.optional().nullable(),
  description: z.string().trim().optional().nullable(),
  material: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  supplier: id.optional().nullable(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  minimumStock: z.coerce.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  images: z.array(z.string()).optional(),
  variants: z.array(variantInputSchema).optional(),
});

const productUpdateSchema = productCreateSchema.partial();

module.exports = { productCreateSchema, productUpdateSchema, variantInputSchema };