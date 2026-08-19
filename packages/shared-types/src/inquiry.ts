export type OrderInquiryCategory =
  | 'general'
  | 'sales'
  | 'product_question'
  | 'shipping'
  | 'cancellation'
  | 'return_refund'
  | 'billing'
  | 'partnership'
  | 'other';


export type OrderInquiryPriority = 'low' | 'medium' | 'high' | 'urgent';

export type OrderInquiryStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'resolved'
  | 'closed';

export interface OrderInquiryReply {
  id: number;
  inquiry_id: number;
  sender_type: 'customer' | 'admin';
  sender_id?: number | null;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface OrderInquiry {
  id: number;
  inquiry_number: string;
  order_id?: number | null;
  user_id?: number | null;
  customer_name: string;
  customer_email: string;
  subject: string;
  category: OrderInquiryCategory;
  priority: OrderInquiryPriority;
  status: OrderInquiryStatus;
  message: string;
  created_at: string;
  updated_at: string;
  order_number?: string | null;
  replies?: OrderInquiryReply[];
}
