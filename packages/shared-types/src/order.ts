// ─── Order Status ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded';

// ─── Order ────────────────────────────────────────────────────────────────────

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: string; // JSON string
  notes: string | null;
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}

// ─── Order Item (Price Snapshot) ─────────────────────────────────────────────
// unit_cost_price and unit_selling_price are SNAPSHOTTED at checkout time
// so future price edits never corrupt historical profit calculations.
export interface OrderItem {
  id: number;
  order_id: number;
  variant_id: number;
  quantity: number;
  unit_cost_price: number;    // ← snapshot of cost at time of purchase
  unit_selling_price: number; // ← snapshot of selling price at time of purchase
  line_total: number;         // unit_selling_price × quantity
}

// ─── Shipping Address DTO ─────────────────────────────────────────────────────

export interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

// ─── Checkout DTOs ───────────────────────────────────────────────────────────

export interface CheckoutItemDto {
  variant_id: number;
  quantity: number;
}

export interface CreateOrderDto {
  items: CheckoutItemDto[];
  shipping_address: ShippingAddress;
  notes?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  payment_status?: PaymentStatus;
}

// ─── Order with Items ─────────────────────────────────────────────────────────

export interface OrderWithItems extends Order {
  items: (OrderItem & { variant_sku?: string; variant_label?: string })[];
}
