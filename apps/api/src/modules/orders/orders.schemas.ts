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

export const GuestCheckoutSchema = z.object({
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  phone: z.string().optional(),
  shipping_address: z.union([z.string(), ShippingAddressSchema]),
  billing_address: z.union([z.string(), ShippingAddressSchema]).optional(),
  notes: z.string().optional(),
  payment_method: z.string().optional(),
  items: z
    .array(
      z.object({
        variant_id: z.number().int().positive().optional(),
        product_id: z.number().int().positive().optional(),
        sku: z.string().optional(),
        unit_price: z.number().optional(),
        quantity: z.number().int().positive().default(1),
      }),
    )
    .min(1, 'Order must have at least one item'),
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
  limit: z.coerce.number().int().positive().max(1000).default(50),
  status: z
    .enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .optional(),
  payment_status: z
    .enum(['unpaid', 'paid', 'partially_paid', 'refunded'])
    .optional(),
  user_id: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'amount_high', 'amount_low']).optional().default('newest'),
});

export const BulkUpdateStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'At least one order ID is required'),
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

export const BulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'At least one order ID is required'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;
export type BulkUpdateStatusInput = z.infer<typeof BulkUpdateStatusSchema>;
export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;

