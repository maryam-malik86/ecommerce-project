import type { Request, Response, NextFunction } from 'express';
import { CatalogService } from './catalog.service.js';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
} from './catalog.schemas.js';

const catalogService = new CatalogService();

export class CatalogController {
  // GET /catalog/categories
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await catalogService.getAllCategories();
      res.json({ success: true, message: 'Categories retrieved', data });
    } catch (err) { next(err); }
  }

  // GET /catalog/products
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ProductQuerySchema.parse(req.query);
      const result = await catalogService.listProducts(query);
      res.json(result);
    } catch (err) { next(err); }
  }

  // GET /catalog/products/:id
  async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await catalogService.getProduct(Number(req.params['id']));
      res.json({ success: true, message: 'Product retrieved', data });
    } catch (err) { next(err); }
  }

  // POST /catalog/products  [admin]
  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateProductSchema.parse(req.body);
      const data = await catalogService.createProduct(input);
      res.status(201).json({ success: true, message: 'Product created', data });
    } catch (err) { next(err); }
  }

  // PATCH /catalog/products/:id  [admin]
  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = UpdateProductSchema.parse(req.body);
      const data = await catalogService.updateProduct(Number(req.params['id']), input);
      res.json({ success: true, message: 'Product updated', data });
    } catch (err) { next(err); }
  }

  // DELETE /catalog/products/:id  [admin]
  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await catalogService.deleteProduct(Number(req.params['id']));
      res.json({ success: true, message: 'Product deleted', data: null });
    } catch (err) { next(err); }
  }
}
