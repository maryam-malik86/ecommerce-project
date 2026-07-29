import { z } from 'zod';

const ShippingAddressSchema = z.object({
  full_name: z.string().min(1),
  address_line1: z.string().min(1),
  address_line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
});

export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variant_id: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'Order must have at least one item'),
  shipping_address: ShippingAddressSchema,
  notes: z.string().max(1000).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  payment_status: z
    .enum(['unpaid', 'paid', 'partially_paid', 'refunded'])
    .optional(),
});

export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .optional(),
  user_id: z.coerce.number().int().positive().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;
