import { z } from 'zod';

export const CreateVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  option_label: z.string().min(1).max(255),
  cost_price: z.number().positive(),
  selling_price: z.number().positive(),
  stock_quantity: z.number().int().min(0).default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  image_url: z.string().url().optional(),
});

export const CreateProductSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  variants: z.array(CreateVariantSchema).min(1, 'At least one variant is required'),
});

export const UpdateProductSchema = CreateProductSchema.partial().omit({ variants: true });

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  sort_by: z.enum(['name', 'created_at', 'selling_price']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQueryInput = z.infer<typeof ProductQuerySchema>;
