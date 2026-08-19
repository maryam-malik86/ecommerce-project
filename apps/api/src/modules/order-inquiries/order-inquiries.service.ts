import { OrderInquiriesRepository } from './order-inquiries.repository.js';
import { emailTemplatesService } from '../email-templates/email-templates.service.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import type { InquiryQueryInput, CreateInquiryInput, ReplyInquiryInput, UpdateInquiryStatusInput } from './order-inquiries.schemas.js';
import type { OrderInquiry, PaginatedResponse } from '@ecommerce/shared-types';

export class OrderInquiriesService {
  private repo = new OrderInquiriesRepository();

  async createInquiry(input: CreateInquiryInput, userId?: number | null): Promise<OrderInquiry> {
    const yearStr = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const inquiryNumber = `INQ-${yearStr}-${randomCode}`;

    const id = await this.repo.createInquiry(inquiryNumber, input, userId);
    const inquiry = (await this.repo.findInquiryById(id))!;

    // Auto-trigger inquiry confirmation email
    emailTemplatesService.triggerInquiryConfirmation({
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      inquiry_number: inquiry.inquiry_number,
      subject: inquiry.subject,
      category: inquiry.category,
      message: inquiry.message,
    }).catch(() => {});

    return inquiry;
  }

  async listInquiries(query: InquiryQueryInput): Promise<PaginatedResponse<OrderInquiry>> {
    const { rows, total } = await this.repo.findInquiries(query);
    const { page, limit } = query;
    const total_pages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Inquiries retrieved',
      data: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      },
    };
  }

  async getInquiry(id: number): Promise<OrderInquiry> {
    const inquiry = await this.repo.findInquiryById(id);
    if (!inquiry) throw createApiError(404, `Inquiry #${id} not found`);
    return inquiry;
  }

  async updateStatus(id: number, input: UpdateInquiryStatusInput): Promise<OrderInquiry> {
    const existing = await this.repo.findInquiryById(id);
    if (!existing) throw createApiError(404, `Inquiry #${id} not found`);

    await this.repo.updateInquiryStatus(id, input);
    return (await this.repo.findInquiryById(id))!;
  }

  async addReply(id: number, input: ReplyInquiryInput, senderId?: number | null, senderName?: string): Promise<OrderInquiry> {
    const existing = await this.repo.findInquiryById(id);
    if (!existing) throw createApiError(404, `Inquiry #${id} not found`);

    await this.repo.addReply(id, input, senderId, senderName);
    const updated = (await this.repo.findInquiryById(id))!;

    // Auto-trigger reply notification email to customer if sent by admin
    if (input.sender_type === 'admin') {
      emailTemplatesService.triggerInquiryReplyNotification({
        customer_name: updated.customer_name,
        customer_email: updated.customer_email,
        inquiry_number: updated.inquiry_number,
        subject: updated.subject,
        sender_name: senderName || 'Support Agent',
        reply_message: input.message,
      }).catch(() => {});
    }

    return updated;
  }


  async deleteInquiry(id: number): Promise<void> {
    const existing = await this.repo.findInquiryById(id);
    if (!existing) throw createApiError(404, `Inquiry #${id} not found`);
    await this.repo.deleteInquiry(id);
  }
}
