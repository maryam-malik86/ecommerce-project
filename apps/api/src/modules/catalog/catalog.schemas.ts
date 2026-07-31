import { z } from 'zod';

export const CreateVariantSchema = z.object({
  id: z.number().int().optional(),
  sku: z.string().min(1).max(100),
  option_label: z.string().min(1).max(255),
  cost_price: z.number().min(0),
  selling_price: z.number().min(0),
  stock_quantity: z.number().int().min(0).default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  image_url: z.string().optional().nullable(),
});

export const CreateProductSchema = z.object({
  category_id: z.number().int().positive().optional(),
  supplier_id: z.number().int().positive().optional().nullable(),
  supplier_ref: z.string().optional().nullable(),
  our_ref: z.string().optional().nullable(),
  ba_ref: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  season: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  variants: z.array(CreateVariantSchema).optional(),
});

export const UpdateProductSchema = z.object({
  category_id: z.number().int().positive().optional(),
  supplier_id: z.number().int().positive().optional().nullable(),
  supplier_ref: z.string().optional().nullable(),
  our_ref: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  season: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  variants: z.array(CreateVariantSchema).optional(),
});

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  supplier_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  brand: z.string().optional(),
  department: z.string().optional(),
  sort_by: z.enum(['name', 'created_at', 'selling_price']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQueryInput = z.infer<typeof ProductQuerySchema>;
