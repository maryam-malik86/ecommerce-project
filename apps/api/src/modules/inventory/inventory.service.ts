import { getDb } from '../../config/db.js';
import type { Knex } from 'knex';
import { InventoryRepository } from './inventory.repository.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import type { CreateStockMovementInput, CreateSupplierInput, UpdateSupplierInput } from './inventory.schemas.js';

export class InventoryService {
  private repo = new InventoryRepository();

  // ── Suppliers ───────────────────────────────────────────────────────────────

  async getAllSuppliers() {
    return this.repo.findAllSuppliers();
  }

  async getSupplier(id: number) {
    const supplier = await this.repo.findSupplierById(id);
    if (!supplier) throw createApiError(404, `Supplier ${id} not found`);
    return supplier;
  }

  async createSupplier(input: CreateSupplierInput) {
    const id = await this.repo.createSupplier({
      name: input.name,
      contact_email: input.contact_email ?? null,
      contact_phone: input.contact_phone ?? null,
      address: input.address ?? null,
    });
    return this.repo.findSupplierById(id);
  }

  async updateSupplier(id: number, input: UpdateSupplierInput) {
    await this.getSupplier(id); // ensure exists
    await this.repo.updateSupplier(id, input);
    return this.repo.findSupplierById(id);
  }

  // ── Stock Movements ─────────────────────────────────────────────────────────
  // All stock adjustments run inside a MySQL transaction:
  // 1. Log the movement in the stock_movements ledger
  // 2. Adjust product_variants.stock_quantity atomically

  async recordStockMovement(input: CreateStockMovementInput) {
    const db = getDb();

    return db.transaction(async (trx) => {
      // 1. Record the ledger entry
      await this.repo.createMovement(
        {
          variant_id: input.variant_id,
          supplier_id: input.supplier_id ?? null,
          order_id: null,
          type: input.type,
          quantity: input.quantity,
          note: input.note ?? null,
        },
        trx as Knex.Transaction,
      );

      // 2. Adjust variant stock
      // For 'in' / positive adjustment: add quantity
      // For 'out' / negative adjustment: subtract quantity
      const delta =
        input.type === 'in' ? Math.abs(input.quantity)
        : input.type === 'out' ? -Math.abs(input.quantity)
        : input.quantity; // adjustment: signed

      await this.repo.adjustVariantStock(input.variant_id, delta, trx as Knex.Transaction);

      return { recorded: true, delta };
    });
  }

  async getVariantMovements(variantId: number) {
    return this.repo.findMovementsByVariant(variantId);
  }

  // ── Low Stock Alerts ────────────────────────────────────────────────────────

  async getLowStockAlerts() {
    return this.repo.findLowStockVariants();
  }
}
