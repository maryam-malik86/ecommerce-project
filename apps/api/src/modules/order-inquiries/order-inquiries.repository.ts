import { getDb } from '../../config/db.js';
import type { OrderInquiry, OrderInquiryReply } from '@ecommerce/shared-types';
import type { InquiryQueryInput, CreateInquiryInput, ReplyInquiryInput, UpdateInquiryStatusInput } from './order-inquiries.schemas.js';

export class OrderInquiriesRepository {
  private get db() {
    return getDb();
  }

  async createInquiry(
    inquiryNumber: string,
    input: CreateInquiryInput,
    userId?: number | null,
  ): Promise<number> {
    const [id] = await this.db('order_inquiries').insert({
      inquiry_number: inquiryNumber,
      order_id: input.order_id || null,
      user_id: userId || null,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      subject: input.subject,
      category: input.category,
      priority: input.priority || 'medium',
      status: 'open',
      message: input.message,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return id as number;
  }

  async findInquiries(query: InquiryQueryInput): Promise<{ rows: OrderInquiry[]; total: number }> {
    const { page, limit, status, category, priority, order_id, search, sort } = query;
    const offset = (page - 1) * limit;

    const applyFilters = (b: any) => {
      if (status) b.where('order_inquiries.status', status);
      if (category) b.where('order_inquiries.category', category);
      if (priority) b.where('order_inquiries.priority', priority);
      if (order_id) b.where('order_inquiries.order_id', order_id);
      if (search) {
        const term = `%${search.trim().toLowerCase()}%`;
        b.where((builder: any) => {
          builder
            .whereILike('order_inquiries.inquiry_number', term)
            .orWhereILike('order_inquiries.customer_name', term)
            .orWhereILike('order_inquiries.customer_email', term)
            .orWhereILike('order_inquiries.subject', term);
        });
      }
    };

    const countQuery = this.db('order_inquiries')
      .modify(applyFilters)
      .count('* as count')
      .first();

    let dataQuery = this.db('order_inquiries')
      .leftJoin('orders', 'order_inquiries.order_id', 'orders.id')
      .select('order_inquiries.*', 'orders.order_number as order_number')
      .modify(applyFilters);

    if (sort === 'oldest') {
      dataQuery = dataQuery.orderBy('order_inquiries.created_at', 'asc');
    } else {
      dataQuery = dataQuery.orderBy('order_inquiries.created_at', 'desc');
    }

    const [{ count }] = await Promise.all([countQuery]) as any;
    const rows = await dataQuery.limit(limit).offset(offset);

    return { rows: rows as OrderInquiry[], total: Number(count?.count ?? 0) };
  }

  async findInquiryById(id: number): Promise<OrderInquiry | undefined> {
    const inquiry = await this.db('order_inquiries')
      .leftJoin('orders', 'order_inquiries.order_id', 'orders.id')
      .select('order_inquiries.*', 'orders.order_number as order_number')
      .where('order_inquiries.id', id)
      .first();

    if (!inquiry) return undefined;

    const replies = await this.db('order_inquiry_replies')
      .where('inquiry_id', id)
      .orderBy('created_at', 'asc');

    return { ...inquiry, replies } as OrderInquiry;
  }

  async updateInquiryStatus(id: number, input: UpdateInquiryStatusInput): Promise<void> {
    const dataToUpdate: any = { updated_at: new Date() };
    if (input.status) dataToUpdate.status = input.status;
    if (input.priority) dataToUpdate.priority = input.priority;

    await this.db('order_inquiries').where({ id }).update(dataToUpdate);
  }

  async addReply(inquiryId: number, input: ReplyInquiryInput, senderId?: number | null, senderName?: string): Promise<number> {
    const [replyId] = await this.db('order_inquiry_replies').insert({
      inquiry_id: inquiryId,
      sender_type: input.sender_type || 'admin',
      sender_id: senderId || null,
      sender_name: senderName || input.sender_name || 'Support Agent',
      message: input.message,
      created_at: new Date(),
    });

    // Auto-update inquiry status if provided or default to in_progress / resolved
    const newStatus = input.status || (input.sender_type === 'admin' ? 'in_progress' : 'waiting_on_customer');
    await this.db('order_inquiries').where({ id: inquiryId }).update({
      status: newStatus,
      updated_at: new Date(),
    });

    return replyId as number;
  }

  async deleteInquiry(id: number): Promise<void> {
    await this.db('order_inquiry_replies').where({ inquiry_id: id }).delete();
    await this.db('order_inquiries').where({ id }).delete();
  }
}
