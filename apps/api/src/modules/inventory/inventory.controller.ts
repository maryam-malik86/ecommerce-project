import type { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';
import { CreateStockMovementSchema, CreateSupplierSchema, UpdateSupplierSchema } from './inventory.schemas.js';

const inventoryService = new InventoryService();

export class InventoryController {
  // GET /inventory/suppliers
  async getSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await inventoryService.getAllSuppliers();
      res.json({ success: true, message: 'Suppliers retrieved', data });
    } catch (err) { next(err); }
  }

  // POST /inventory/suppliers  [admin]
  async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateSupplierSchema.parse(req.body);
      const data = await inventoryService.createSupplier(input);
      res.status(201).json({ success: true, message: 'Supplier created', data });
    } catch (err) { next(err); }
  }

  // PATCH /inventory/suppliers/:id  [admin]
  async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = UpdateSupplierSchema.parse(req.body);
      const data = await inventoryService.updateSupplier(Number(req.params['id']), input);
      res.json({ success: true, message: 'Supplier updated', data });
    } catch (err) { next(err); }
  }

  // POST /inventory/movements  [admin, supplier]
  async recordMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateStockMovementSchema.parse(req.body);
      const data = await inventoryService.recordStockMovement(input);
      res.status(201).json({ success: true, message: 'Stock movement recorded', data });
    } catch (err) { next(err); }
  }

  // GET /inventory/variants/:variantId/movements  [admin]
  async getVariantMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await inventoryService.getVariantMovements(Number(req.params['variantId']));
      res.json({ success: true, message: 'Movements retrieved', data });
    } catch (err) { next(err); }
  }

  // GET /inventory/low-stock  [admin]
  async getLowStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await inventoryService.getLowStockAlerts();
      res.json({ success: true, message: 'Low stock alerts retrieved', data });
    } catch (err) { next(err); }
  }
}
