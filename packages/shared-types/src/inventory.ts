// ─── Supplier ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Stock Movement (Ledger) ──────────────────────────────────────────────────
// Every stock change is recorded here for auditability.
// type 'in'  = stock received (purchase / return)
// type 'out' = stock consumed (sale / reservation confirmed)
// type 'reserved' = soft reservation during checkout
// type 'released' = reservation cancelled (e.g. abandoned cart)
// type 'adjustment' = manual correction by admin

export type StockMovementType = 'in' | 'out' | 'reserved' | 'released' | 'adjustment';

export interface StockMovement {
  id: number;
  variant_id: number;
  supplier_id: number | null;
  order_id: number | null;
  type: StockMovementType;
  quantity: number;         // positive = stock added; negative = stock removed
  note: string | null;
  created_at: Date;
}

// ─── Stock Reservation ────────────────────────────────────────────────────────
// Soft reservation held during checkout to prevent overselling.

export type ReservationStatus = 'pending' | 'confirmed' | 'released' | 'expired';

export interface StockReservation {
  id: number;
  variant_id: number;
  order_id: number | null;
  quantity: number;
  status: ReservationStatus;
  expires_at: Date;
  created_at: Date;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateStockMovementDto {
  variant_id: number;
  supplier_id?: number;
  type: StockMovementType;
  quantity: number;
  note?: string;
}

export interface LowStockAlert {
  variant_id: number;
  sku: string;
  option_label: string;
  product_name: string;
  stock_quantity: number;
  low_stock_threshold: number;
}
