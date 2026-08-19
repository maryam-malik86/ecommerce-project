import { z } from 'zod';

export const CreateInquirySchema = z.object({
  order_id: z.coerce.number().int().positive().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  category: z
    .enum(['general', 'sales', 'product_question', 'shipping', 'cancellation', 'return_refund', 'billing', 'partnership', 'other'])
    .default('other'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export const ReplyInquirySchema = z.object({
  message: z.string().min(1, 'Reply message cannot be empty'),
  sender_type: z.enum(['customer', 'admin']).optional().default('admin'),
  sender_name: z.string().optional(),
  status: z
    .enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'])
    .optional(),
});

export const UpdateInquiryStatusSchema = z.object({
  status: z
    .enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const InquiryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
  status: z
    .enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'])
    .optional(),
  category: z
    .enum(['general', 'sales', 'product_question', 'shipping', 'cancellation', 'return_refund', 'billing', 'partnership', 'other'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  order_id: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'priority_high']).optional().default('newest'),
});

export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;
export type ReplyInquiryInput = z.infer<typeof ReplyInquirySchema>;
export type UpdateInquiryStatusInput = z.infer<typeof UpdateInquiryStatusSchema>;
export type InquiryQueryInput = z.infer<typeof InquiryQuerySchema>;
