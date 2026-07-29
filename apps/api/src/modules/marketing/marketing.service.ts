import { MarketingRepository } from './marketing.repository.js';
import { sendMail } from '../../utils/mailer.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import { logger } from '../../utils/logger.js';
import type { SubscribeInput, BroadcastInput } from './marketing.schemas.js';

export class MarketingService {
  private repo = new MarketingRepository();

  async subscribe(input: SubscribeInput) {
    const existing = await this.repo.findByEmail(input.email);

    if (existing) {
      if (existing.is_active) {
        throw createApiError(409, 'This email is already subscribed');
      }
      // Reactivate if they previously unsubscribed
      await this.repo.unsubscribe(input.email); // sets is_active = false temporarily
      // Re-insert with fresh record — for simplicity just reactivate:
      await this.repo.subscribe(input.email, input.name);
      return { message: 'Resubscribed successfully' };
    }

    await this.repo.subscribe(input.email, input.name);
    return { message: 'Subscribed successfully' };
  }

  async unsubscribe(email: string) {
    const subscriber = await this.repo.findByEmail(email);
    if (!subscriber) throw createApiError(404, 'Email not found in subscribers list');
    await this.repo.unsubscribe(email);
    return { message: 'Unsubscribed successfully' };
  }

  async getAllSubscribers() {
    return this.repo.findAllActive();
  }

  async broadcast(input: BroadcastInput) {
    const subscribers = await this.repo.findAllActive();

    if (subscribers.length === 0) {
      return { sent: 0, message: 'No active subscribers to send to' };
    }

    const emails = subscribers.map((s) => s.email);

    logger.info(`Broadcasting newsletter to ${emails.length} subscribers`, { subject: input.subject });

    // Send in batches of 50 to avoid SMTP limits
    const batchSize = 50;
    let sent = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await sendMail({ to: batch, subject: input.subject, html: input.html, text: input.text });
      sent += batch.length;
    }

    return { sent, message: `Newsletter sent to ${sent} subscribers` };
  }
}
