import { z } from 'zod';

export const CreateStockMovementSchema = z.object({
  variant_id: z.number().int().positive(),
  supplier_id: z.number().int().positive().optional(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().int().refine((n) => n !== 0, { message: 'Quantity must not be 0' }),
  note: z.string().max(500).optional(),
});

export const CreateSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(50).optional(),
  address: z.string().optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

export type CreateStockMovementInput = z.infer<typeof CreateStockMovementSchema>;
export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
