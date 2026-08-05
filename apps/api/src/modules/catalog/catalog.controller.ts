import type { Request, Response, NextFunction } from 'express';
import { CatalogService } from './catalog.service.js';
import {
  ProductQuerySchema, CreateProductSchema, UpdateProductSchema,
  AddOptionsSchema, PatchVariantSchema,
  CreateCategorySchema, UpdateCategorySchema,
  CreateCollectionSchema, UpdateCollectionSchema,
} from './catalog.schemas.js';

const svc = new CatalogService();

export class CatalogController {
  // ── Suppliers ─────────────────────────────────────────────────────────────

  async getSuppliers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await svc.getAllSuppliers();
      res.json({ success: true, message: 'Suppliers retrieved', data });
    } catch (err) { next(err); }
  }

  async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await svc.createSupplier(req.body);
      res.status(201).json({ success: true, message: 'Supplier created', data });
    } catch (err) { next(err); }
  }

  // ── Categories ────────────────────────────────────────────────────────────

  /** GET /catalog/categories/tree — nested tree for category picker */
  async getCategoryTree(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await svc.getCategoryTree();
      res.json({ success: true, message: 'Category tree retrieved', data });
    } catch (err) { next(err); }
  }

  /** GET /catalog/categories — flat list */
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await svc.getAllCategoriesFlat();
      res.json({ success: true, message: 'Categories retrieved', data });
    } catch (err) { next(err); }
  }

  /** POST /catalog/categories */
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateCategorySchema.parse(req.body);
      const data = await svc.createCategory(input);
      res.status(201).json({ success: true, message: 'Category created', data });
    } catch (err) { next(err); }
  }

  /** PATCH /catalog/categories/:id */
  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const input = UpdateCategorySchema.parse(req.body);
      const data = await svc.updateCategory(id, input);
      res.json({ success: true, message: 'Category updated', data });
    } catch (err) { next(err); }
  }

  /** DELETE /catalog/categories/:id */
  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await svc.deleteCategory(Number(req.params['id']));
      res.json({ success: true, message: 'Category deleted', data: null });
    } catch (err) { next(err); }
  }

  // ── Collections ───────────────────────────────────────────────────────────

  /** GET /catalog/collections */
  async getCollections(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await svc.getAllCollections();
      res.json({ success: true, message: 'Collections retrieved', data });
    } catch (err) { next(err); }
  }

  /** POST /catalog/collections */
  async createCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateCollectionSchema.parse(req.body);
      const data = await svc.createCollection(input);
      res.status(201).json({ success: true, message: 'Collection created', data });
    } catch (err) { next(err); }
  }

  /** PATCH /catalog/collections/:id */
  async updateCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const input = UpdateCollectionSchema.parse(req.body);
      const data = await svc.updateCollection(id, input);
      res.json({ success: true, message: 'Collection updated', data });
    } catch (err) { next(err); }
  }

  /** DELETE /catalog/collections/:id */
  async deleteCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await svc.deleteCollection(Number(req.params['id']));
      res.json({ success: true, message: 'Collection deleted', data: null });
    } catch (err) { next(err); }
  }

  // ── Products ──────────────────────────────────────────────────────────────

  /** GET /catalog/products */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ProductQuerySchema.parse(req.query);
      const result = await svc.listProducts(query);
      res.json(result);
    } catch (err) { next(err); }
  }

  /** GET /catalog/products/:id */
  async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await svc.getProduct(Number(req.params['id']));
      res.json({ success: true, message: 'Product retrieved', data });
    } catch (err) { next(err); }
  }

  /** POST /catalog/products */
  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateProductSchema.parse(req.body);
      const data = await svc.createProduct(input);
      res.status(201).json({ success: true, message: 'Product created', data });
    } catch (err) { next(err); }
  }

  /** PATCH /catalog/products/:id */
  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = UpdateProductSchema.parse(req.body);
      const data = await svc.updateProduct(Number(req.params['id']), input);
      res.json({ success: true, message: 'Product updated', data });
    } catch (err) { next(err); }
  }

  /** DELETE /catalog/products/:id */
  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await svc.deleteProduct(Number(req.params['id']));
      res.json({ success: true, message: 'Product deleted', data: null });
    } catch (err) { next(err); }
  }

  // ── Options & Variant Generation ──────────────────────────────────────────

  /** POST /catalog/products/:id/options */
  async addOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = Number(req.params['id']);
      const input = AddOptionsSchema.parse(req.body);
      const data = await svc.addOptions(productId, input);
      res.status(201).json({ success: true, message: 'Options added', data });
    } catch (err) { next(err); }
  }

  /** POST /catalog/products/:id/variants/generate */
  async generateVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = Number(req.params['id']);
      const data = await svc.generateVariants(productId);
      res.status(201).json({ success: true, message: 'Variants generated', data });
    } catch (err) { next(err); }
  }

  // ── Variant ───────────────────────────────────────────────────────────────

  /** PATCH /catalog/variants/:id */
  async patchVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variantId = Number(req.params['id']);
      const input = PatchVariantSchema.parse(req.body);
      const data = await svc.patchVariant(variantId, undefined, input);
      res.json({ success: true, message: 'Variant updated', data });
    } catch (err) { next(err); }
  }

  /** DELETE /catalog/variants/:id */
  async deleteVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variantId = Number(req.params['id']);
      await svc.deleteVariant(variantId);
      res.json({ success: true, message: 'Variant deleted', data: null });
    } catch (err) { next(err); }
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  /** POST /catalog/products/:id/publish */
  async publishProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = Number(req.params['id']);
      const data = await svc.publishProduct(productId);
      res.json({ success: true, message: 'Product published', data });
    } catch (err) { next(err); }
  }

  // ── Inventory Alerts ──────────────────────────────────────────────────────

  /** GET /catalog/inventory/low-stock */
  async getLowStockAlerts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await svc.getLowStockAlerts();
      res.json({ success: true, message: 'Low stock alerts retrieved', data });
    } catch (err) { next(err); }
  }
}
