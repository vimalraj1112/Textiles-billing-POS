const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const userCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'STAFF']).optional(),
  joiningDate: z.string().optional().nullable(),
});

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'STAFF']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  joiningDate: z.string().optional().nullable(),
});

const passwordResetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

module.exports = { loginSchema, userCreateSchema, userUpdateSchema, passwordResetSchema };