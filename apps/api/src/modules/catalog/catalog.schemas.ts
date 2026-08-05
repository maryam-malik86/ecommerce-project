import { z } from 'zod';

// ── Category ──────────────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional().nullable(),
  parent_id: z.number().int().positive().optional().nullable(),
  rank: z.number().int().min(0).default(0),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// ── Collection ────────────────────────────────────────────────────────────────

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional().nullable(),
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

// ── Product Options ───────────────────────────────────────────────────────────

export const OptionDefinitionSchema = z.object({
  name: z.string().min(1).max(100),
  values: z.array(z.string().min(1).max(100)).min(1),
});

export const AddOptionsSchema = z.object({
  options: z.array(OptionDefinitionSchema).min(1),
});

// ── Variant Patch ─────────────────────────────────────────────────────────────

export const PatchVariantSchema = z.object({
  cost_price: z.number().min(0).optional(),
  selling_price: z.number().min(0).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  image_url: z.string().optional().nullable(),
});

export type PatchVariantInput = z.infer<typeof PatchVariantSchema>;

// ── Product Create / Update ───────────────────────────────────────────────────

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  supplier_id: z.number().int().positive().optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).default('draft'),
  category_ids: z.array(z.number().int().positive()).min(1),
  collection_ids: z.array(z.number().int().positive()).optional().default([]),
  // Seed values used only to create the initial default variant
  seed_cost_price: z.number().min(0).optional().default(0),
  seed_selling_price: z.number().min(0).optional().default(0),
  seed_stock_quantity: z.number().int().min(0).optional().default(0),
  // Extra refs retained from existing system
  supplier_ref: z.string().max(100).optional().nullable(),
  our_ref: z.string().max(100).optional().nullable(),
  ba_ref: z.string().max(100).optional().nullable(),
  image_url: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().default([]),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  supplier_id: z.number().int().positive().optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  category_ids: z.array(z.number().int().positive()).optional(),
  collection_ids: z.array(z.number().int().positive()).optional(),
  supplier_ref: z.string().max(100).optional().nullable(),
  our_ref: z.string().max(100).optional().nullable(),
  ba_ref: z.string().max(100).optional().nullable(),
  image_url: z.string().optional().nullable(),
  photos: z.array(z.string()).optional(),
});

// ── Listing Query ─────────────────────────────────────────────────────────────

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
  search: z.string().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  collection_id: z.coerce.number().int().positive().optional(),
  supplier_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  brand: z.string().optional(),
  sort_by: z.enum(['name', 'created_at', 'price_from', 'total_stock']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQueryInput = z.infer<typeof ProductQuerySchema>;
export type AddOptionsInput = z.infer<typeof AddOptionsSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;
