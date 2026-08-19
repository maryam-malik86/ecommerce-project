import { emailTemplatesRepository } from './email-templates.repository.js';
import type { UpdateEmailTemplateInput } from './email-templates.schemas.js';
import { renderTemplate } from '../../utils/templateEngine.js';
import { sendMail } from '../../utils/mailer.js';
import { logger } from '../../utils/logger.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';

export class EmailTemplatesService {
  async getAllTemplates() {
    return emailTemplatesRepository.findAll();
  }

  async getTemplateByKey(key: string) {
    const template = await emailTemplatesRepository.findByKey(key);
    if (!template) {
      throw createApiError(404, `Email template '${key}' not found`);
    }
    return template;
  }

  async updateTemplate(key: string, input: UpdateEmailTemplateInput) {
    const existing = await emailTemplatesRepository.findByKey(key);
    if (!existing) {
      throw createApiError(404, `Email template '${key}' not found`);
    }
    return emailTemplatesRepository.updateByKey(key, input);
  }

  async sendTestEmail(key: string, toEmail: string) {
    const template = await emailTemplatesRepository.findByKey(key);
    if (!template) {
      throw createApiError(404, `Email template '${key}' not found`);
    }

    const mockVariables: Record<string, any> = {
      customer_name: 'John Doe',
      inquiry_number: 'INQ-2026-TEST',
      subject: 'Sample Product Inquiry',
      category: 'General Client Query',
      message: 'This is a sample test inquiry message submitted from the StoreCo website.',
      sender_name: 'Support Agent (Test)',
      reply_message: 'Thank you for reaching out! This is a sample response to verify your email template layout.',
      order_id: '1001',
      order_number: 'ORD-2026-1001',
      subtotal_amount: '129.99',
      total_amount: '129.99',
      shipping_address: '123 Test Street, Suite 100, San Francisco, CA 94105',
      carrier: 'FedEx Express',
      tracking_number: 'TRK-9842104928',
      items_table_html: `
        <table style="width:100%; border-collapse:collapse;">
          <tr style="background:#f8fafc;">
            <th style="padding:8px; border-bottom:1px solid #ddd; text-align:left;">Item</th>
            <th style="padding:8px; border-bottom:1px solid #ddd; text-align:center;">Qty</th>
            <th style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">Price</th>
          </tr>
          <tr>
            <td style="padding:8px; border-bottom:1px solid #eee;">Azyyau Premium T-Shirt (Large)</td>
            <td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">2</td>
            <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">$129.99</td>
          </tr>
        </table>
      `,
    };

    const renderedSubject = renderTemplate(template.subject, mockVariables);
    const renderedHtml = renderTemplate(template.html_content, mockVariables);
    const renderedText = template.text_content ? renderTemplate(template.text_content, mockVariables) : undefined;

    await sendMail({
      to: toEmail,
      subject: `[TEST] ${renderedSubject}`,
      html: renderedHtml,
      text: renderedText,
    });

    logger.info(`Test email sent for template '${key}' to ${toEmail}`);
    return { sent: true, to: toEmail };
  }

  // ── Trigger Helper: Send Client Inquiry Confirmation ───────────────────────
  async triggerInquiryConfirmation(inquiry: {
    customer_name: string;
    customer_email: string;
    inquiry_number: string;
    subject: string;
    category: string;
    message: string;
  }) {
    try {
      const template = await emailTemplatesRepository.findByKey('inquiry_confirmation');
      if (!template || !template.is_active) return;

      const vars = {
        customer_name: inquiry.customer_name,
        inquiry_number: inquiry.inquiry_number,
        subject: inquiry.subject,
        category: inquiry.category.replace('_', ' ').toUpperCase(),
        message: inquiry.message,
      };

      await sendMail({
        to: inquiry.customer_email,
        subject: renderTemplate(template.subject, vars),
        html: renderTemplate(template.html_content, vars),
        text: template.text_content ? renderTemplate(template.text_content, vars) : undefined,
      });
    } catch (err) {
      logger.error('Failed to send inquiry confirmation email', { error: err });
    }
  }

  // ── Trigger Helper: Send Inquiry Reply Notification ───────────────────────
  async triggerInquiryReplyNotification(inquiry: {
    customer_name: string;
    customer_email: string;
    inquiry_number: string;
    subject: string;
    sender_name: string;
    reply_message: string;
  }) {
    try {
      const template = await emailTemplatesRepository.findByKey('inquiry_reply');
      if (!template || !template.is_active) return;

      const vars = {
        customer_name: inquiry.customer_name,
        inquiry_number: inquiry.inquiry_number,
        subject: inquiry.subject,
        sender_name: inquiry.sender_name,
        reply_message: inquiry.reply_message,
      };

      await sendMail({
        to: inquiry.customer_email,
        subject: renderTemplate(template.subject, vars),
        html: renderTemplate(template.html_content, vars),
        text: template.text_content ? renderTemplate(template.text_content, vars) : undefined,
      });
    } catch (err) {
      logger.error('Failed to send inquiry reply notification email', { error: err });
    }
  }

  // ── Trigger Helper: Send Order Confirmation & Invoice ──────────────────────
  async triggerOrderConfirmationInvoice(order: {
    id: number;
    order_number?: string;
    customer_name: string;
    customer_email: string;
    total_amount: number;
    shipping_address: string;
    items: Array<{ title: string; quantity: number; unit_price: number }>;
  }) {
    try {
      const template = await emailTemplatesRepository.findByKey('order_confirmation_invoice');
      if (!template || !template.is_active) return;

      const itemsRowsHtml = (order.items || []).map((item) => `
        <tr>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; font-weight: 500; color: #1e293b;">${item.title}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:center; font-weight: 600;">${item.quantity}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-weight: 600;">$${(item.unit_price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('');

      const itemsTableHtml = `
        <table class="invoice-table" style="width:100%; border-collapse:collapse; margin:16px 0;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
              <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; color:#64748b; text-align:left;">Item</th>
              <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; color:#64748b; text-align:center;">Qty</th>
              <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; color:#64748b; text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>
      `;

      const vars = {
        order_id: String(order.id),
        order_number: order.order_number || `ORD-${order.id}`,
        customer_name: order.customer_name,
        subtotal_amount: Number(order.total_amount).toFixed(2),
        total_amount: Number(order.total_amount).toFixed(2),
        shipping_address: order.shipping_address,
        items_table_html: itemsTableHtml,
      };

      await sendMail({
        to: order.customer_email,
        subject: renderTemplate(template.subject, vars),
        html: renderTemplate(template.html_content, vars),
        text: template.text_content ? renderTemplate(template.text_content, vars) : undefined,
      });
    } catch (err) {
      logger.error('Failed to send order confirmation invoice email', { error: err });
    }
  }

  // ── Trigger Helper: Send Order Status Shipped ─────────────────────────────
  async triggerOrderStatusShipped(order: {
    id: number;
    customer_name: string;
    customer_email: string;
    carrier: string;
    tracking_number: string;
    shipping_address: string;
  }) {
    try {
      const template = await emailTemplatesRepository.findByKey('order_status_shipped');
      if (!template || !template.is_active) return;

      const vars = {
        order_id: String(order.id),
        customer_name: order.customer_name,
        carrier: order.carrier || 'Standard Shipping',
        tracking_number: order.tracking_number || 'N/A',
        shipping_address: order.shipping_address,
      };

      await sendMail({
        to: order.customer_email,
        subject: renderTemplate(template.subject, vars),
        html: renderTemplate(template.html_content, vars),
        text: template.text_content ? renderTemplate(template.text_content, vars) : undefined,
      });
    } catch (err) {
      logger.error('Failed to send order status shipped email', { error: err });
    }
  }
}

export const emailTemplatesService = new EmailTemplatesService();
