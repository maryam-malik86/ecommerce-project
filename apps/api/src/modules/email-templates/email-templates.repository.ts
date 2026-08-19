import { getDb } from '../../config/db.js';
import type { EmailTemplate } from '@ecommerce/shared-types';

export class EmailTemplatesRepository {
  async findAll(): Promise<EmailTemplate[]> {
    return getDb()<EmailTemplate>('email_templates').select('*').orderBy('id', 'asc');
  }

  async findByKey(key: string): Promise<EmailTemplate | null> {
    const template = await getDb()<EmailTemplate>('email_templates').where({ key }).first();
    return template || null;
  }

  async findById(id: number): Promise<EmailTemplate | null> {
    const template = await getDb()<EmailTemplate>('email_templates').where({ id }).first();
    return template || null;
  }

  async updateByKey(key: string, data: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    await getDb()('email_templates')
      .where({ key })
      .update({
        ...data,
        updated_at: new Date(),
      });
    return this.findByKey(key);
  }
}


export const emailTemplatesRepository = new EmailTemplatesRepository();
