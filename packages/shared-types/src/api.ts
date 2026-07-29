// ─── Generic API Response Envelopes ──────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string; // only in development
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface ProfitSummary {
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_cost: number;
  net_profit: number;         // SUM((selling_price - cost_price) * qty)
  total_orders: number;
  total_items_sold: number;
  avg_order_value: number;
}

export interface ProfitByProduct {
  product_id: number;
  product_name: string;
  total_revenue: number;
  total_cost: number;
  net_profit: number;
  units_sold: number;
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export interface NewsletterSubscriber {
  id: number;
  email: string;
  name: string | null;
  is_active: boolean;
  subscribed_at: Date;
}

export interface SubscribeDto {
  email: string;
  name?: string;
}
