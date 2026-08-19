import type { Knex } from 'knex';

// Migration 023: Email Templates and System Email Triggers

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('email_templates', (table) => {
    table.increments('id').primary();
    table.string('key', 100).notNullable().unique();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.string('subject', 255).notNullable();
    table.text('html_content', 'longtext').notNullable();
    table.text('text_content').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['key'], 'idx_email_templates_key');
  });

  // Seed default responsive HTML email templates
  const defaultTemplates = [
    {
      key: 'inquiry_confirmation',
      name: 'Client Inquiry Auto-Confirmation',
      description: 'Automatically sent to the client immediately after they submit a new inquiry or support request.',
      subject: 'We received your inquiry: {{inquiry_number}} - {{subject}}',
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #4f46e5; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 32px 24px; line-height: 1.6; font-size: 14px; }
    .card { background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #4338ca; border-radius: 9999px; font-weight: 600; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Inquiry Received</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{customer_name}}</strong>,</p>
      <p>Thank you for reaching out to <strong>StoreCo</strong>. We have received your inquiry and our support team is currently reviewing your request.</p>
      
      <div class="card">
        <p style="margin:0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 600;">INQUIRY REFERENCE</p>
        <p style="margin:0 0 12px 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #4f46e5;">{{inquiry_number}}</p>
        <p style="margin:0 0 4px 0; font-weight: 600; color: #1e293b;">Subject: {{subject}}</p>
        <p style="margin:0; color: #475569;">Category: <span class="badge">{{category}}</span></p>
      </div>

      <p><strong>Your Message:</strong></p>
      <p style="background: #ffffff; padding: 12px; border-left: 4px solid #4f46e5; border-radius: 4px; font-style: italic;">"{{message}}"</p>
      
      <p>We aim to respond to all client queries within 24 hours.</p>
    </div>
    <div class="footer">
      &copy; StoreCo E-Commerce Inc. All rights reserved.
    </div>
  </div>
</body>
</html>`,
      text_content: 'Hello {{customer_name}},\n\nWe received your inquiry {{inquiry_number}} regarding "{{subject}}". Our support team will respond shortly.\n\nStoreCo Team',
      is_active: true,
    },
    {
      key: 'inquiry_reply',
      name: 'Inquiry Reply Notification',
      description: 'Automatically sent to the client when a staff member responds to an inquiry thread.',
      subject: 'Re: {{subject}} [{{inquiry_number}}]',
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0284c7; padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px 24px; line-height: 1.6; font-size: 14px; }
    .reply-box { background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Response to your Inquiry</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{customer_name}}</strong>,</p>
      <p>Our support agent <strong>{{sender_name}}</strong> has replied to your inquiry (Ref: <strong>{{inquiry_number}}</strong>):</p>
      
      <div class="reply-box">
        <p style="margin: 0; color: #0369a1; font-weight: 500;">{{reply_message}}</p>
      </div>

      <p style="font-size: 12px; color: #64748b;">If you have any further questions, you can reply directly to this thread.</p>
    </div>
    <div class="footer">
      &copy; StoreCo Support Team
    </div>
  </div>
</body>
</html>`,
      text_content: 'Hello {{customer_name}},\n\nOur agent {{sender_name}} replied to inquiry {{inquiry_number}}:\n\n{{reply_message}}\n\nStoreCo Support',
      is_active: true,
    },
    {
      key: 'order_confirmation_invoice',
      name: 'Order Confirmation & Itemized Invoice',
      description: 'Automatically sent to the customer upon order creation, featuring a full itemized invoice table, total costs, and shipping address.',
      subject: 'Order Confirmation & Invoice #{{order_id}} - StoreCo',
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #334155; }
    .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #059669; padding: 32px 24px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 32px 24px; line-height: 1.6; font-size: 14px; }
    .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; text-align: left; }
    .invoice-table th { background: #f8fafc; padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    .invoice-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
    .total-row { font-size: 16px; font-weight: bold; color: #059669; }
    .address-card { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>StoreCo</h1>
        <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Official Tax Invoice & Order Receipt</p>
      </div>
    </div>
    <div class="content">
      <p>Hello <strong>{{customer_name}}</strong>,</p>
      <p>Thank you for your purchase! We have received your order <strong>#{{order_id}}</strong> (Ref: {{order_number}}).</p>
      
      <p style="font-weight: bold; margin-bottom: 8px;">Order Summary & Line Items:</p>
      
      {{items_table_html}}

      <div style="max-width: 260px; margin-left: auto; text-align: right; padding-top: 10px;">
        <p style="margin: 4px 0;">Subtotal: <strong>\${{subtotal_amount}}</strong></p>
        <p style="margin: 4px 0; color: #059669;">Shipping: <strong>FREE</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #059669; border-top: 2px solid #e2e8f0; padding-top: 8px;">
          Total: \${{total_amount}}
        </p>
      </div>

      <div class="address-card">
        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #64748b; uppercase">SHIPPING ADDRESS</p>
        <p style="margin: 0; font-family: monospace; white-space: pre-line;">{{shipping_address}}</p>
      </div>
    </div>
    <div class="footer">
      Need help with this order? Reply to this email or visit our client support desk.
    </div>
  </div>
</body>
</html>`,
      text_content: 'Hello {{customer_name}},\n\nThank you for your order #{{order_id}} totaling ${{total_amount}}.\n\nShipping Address:\n{{shipping_address}}\n\nStoreCo Team',
      is_active: true,
    },
    {
      key: 'order_status_shipped',
      name: 'Order Shipment Notification',
      description: 'Automatically sent to the customer when their order fulfillment status is updated to Shipped.',
      subject: 'Your StoreCo Order #{{order_id}} has been shipped! 🚚',
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #2563eb; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 32px 24px; line-height: 1.6; font-size: 14px; }
    .tracking-card { background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Order is On Its Way! 🚚</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{customer_name}}</strong>,</p>
      <p>Great news! Your order <strong>#{{order_id}}</strong> has been handed over to our shipping carrier and is on its way to you.</p>
      
      <div class="tracking-card">
        <p style="margin:0 0 6px 0; font-size: 12px; color: #1d4ed8; font-weight: bold;">CARRIER & TRACKING REFERENCE</p>
        <p style="margin:0 0 4px 0; font-size: 16px; font-weight: bold; color: #1e40af;">{{carrier}}</p>
        <p style="margin:0; font-family: monospace; font-size: 15px; color: #2563eb;">{{tracking_number}}</p>
      </div>

      <p>Destination Address:</p>
      <p style="font-family: monospace; background: #f8fafc; padding: 12px; border-radius: 8px;">{{shipping_address}}</p>
    </div>
    <div class="footer">
      Thank you for shopping with StoreCo!
    </div>
  </div>
</body>
</html>`,
      text_content: 'Hello {{customer_name}},\n\nYour order #{{order_id}} has shipped via {{carrier}} (Tracking: {{tracking_number}}).\n\nStoreCo Team',
      is_active: true,
    },
  ];

  await knex('email_templates').insert(defaultTemplates);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('email_templates');
}
