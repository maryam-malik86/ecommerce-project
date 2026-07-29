import { getDb } from '../../config/db.js';
import type { NewsletterSubscriber } from '@ecommerce/shared-types';

export class MarketingRepository {
  private get db() {
    return getDb();
  }

  async findByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    return this.db('newsletter_subscribers').where({ email }).first() as Promise<NewsletterSubscriber | undefined>;
  }

  async subscribe(email: string, name?: string): Promise<number> {
    const [id] = await this.db('newsletter_subscribers').insert({
      email,
      name: name ?? null,
      is_active: true,
      subscribed_at: new Date(),
    });
    return id as number;
  }

  async unsubscribe(email: string): Promise<void> {
    await this.db('newsletter_subscribers').where({ email }).update({ is_active: false });
  }

  async findAllActive(): Promise<NewsletterSubscriber[]> {
    return this.db('newsletter_subscribers')
      .where({ is_active: true })
      .orderBy('subscribed_at', 'desc') as Promise<NewsletterSubscriber[]>;
  }

  async countSubscribers(): Promise<number> {
    const result = await this.db('newsletter_subscribers').where({ is_active: true }).count('* as count');
    const row = result[0] as { count: string | number } | undefined;
    return Number(row?.count ?? 0);
  }
}
