const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const brandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const sizeSchema = z.object({
  name: z.string().min(1, 'Size name is required').max(30),
  sortOrder: z.coerce.number().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const colorSchema = z.object({
  name: z.string().min(1, 'Color name is required').max(30),
  hex: z.string().regex(/^#([0-9A-Fa-f]{3,8})$/, 'Invalid hex color').optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

module.exports = { categorySchema, brandSchema, sizeSchema, colorSchema };