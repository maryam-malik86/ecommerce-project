import { getDb } from '../../config/db.js';
import type { User } from '@ecommerce/shared-types';

export class AuthRepository {
  private get db() {
    return getDb();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.db('users').where({ email }).first() as Promise<User | undefined>;
  }

  async findById(id: number): Promise<User | undefined> {
    return this.db('users').where({ id }).first() as Promise<User | undefined>;
  }

  async findRoleBySlug(slug: string): Promise<{ id: number } | undefined> {
    const hasRolesTable = await this.db.schema.hasTable('roles');
    if (!hasRolesTable) return undefined;
    return this.db('roles').where({ slug }).select('id').first();
  }

  async create(data: {
    name: string;
    email: string;
    password_hash: string;
    role: string;
    role_id?: number | null;
  }): Promise<number> {
    try {
      const [id] = await this.db('users').insert({
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      });
      return id as number;
    } catch (err: any) {
      console.warn('Insert into users failed, auto-repairing schema:', err?.message || err);
      try {
        await this.db.raw('ALTER TABLE users MODIFY COLUMN role VARCHAR(100) NOT NULL DEFAULT "customer"');
        const [id] = await this.db('users').insert({
          ...data,
          created_at: new Date(),
          updated_at: new Date(),
        });
        return id as number;
      } catch (alterErr) {
        const fallbackRole = data.role_id || data.role !== 'customer' ? 'admin' : 'customer';
        const [id] = await this.db('users').insert({
          ...data,
          role: fallbackRole,
          created_at: new Date(),
          updated_at: new Date(),
        });
        return id as number;
      }
    }
  }

  async findAll(
    search?: string,
    role?: string,
    tagId?: number,
    includeArchived = false
  ): Promise<any[]> {
    const hasRoleId = await this.db.schema.hasColumn('users', 'role_id');
    const hasArchivedAt = await knexHasColumn(this.db, 'users', 'archived_at');

    let q = this.db('users').select(
      'users.id',
      'users.name',
      'users.email',
      'users.role',
      'users.is_active',
      'users.created_at',
      'users.updated_at'
    );

    if (hasRoleId) q = q.select('users.role_id');
    if (hasArchivedAt) q = q.select('users.archived_at');

    if (tagId) {
      q = q.join('customer_tags', 'users.id', 'customer_tags.customer_id').where('customer_tags.tag_id', tagId);
    }

    if (role) {
      q = q.where('users.role', role);
    }

    if (hasArchivedAt && !includeArchived) {
      q = q.whereNull('users.archived_at');
    }

    if (search) {
      const term = `%${search}%`;
      q = q.where((builder) => {
        builder.where('users.name', 'like', term).orWhere('users.email', 'like', term);
      });
    }

    const users = await q.orderBy('users.id', 'desc');

    // Attach LTV metrics and tags if role is customer or for all directory users
    const results = [];
    for (const u of users) {
      const ltv = await this.getCustomerLtvMetrics(u.id);
      const userTags = await this.getCustomerTags(u.id);
      results.push({
        ...u,
        orders_count: ltv.orders_count,
        total_spent: ltv.total_spent,
        avg_order_value: ltv.avg_order_value,
        tags: userTags,
      });
    }

    return results;
  }

  async update(id: number, data: Record<string, any>): Promise<void> {
    try {
      await this.db('users').where({ id }).update({ ...data, updated_at: new Date() });
    } catch (err: any) {
      console.warn('Update users failed, auto-repairing schema:', err?.message || err);
      try {
        await this.db.raw('ALTER TABLE users MODIFY COLUMN role VARCHAR(100) NOT NULL DEFAULT "customer"');
        await this.db('users').where({ id }).update({ ...data, updated_at: new Date() });
      } catch (alterErr) {
        const fallbackRole = data['role_id'] || data['role'] !== 'customer' ? 'admin' : 'customer';
        await this.db('users').where({ id }).update({ ...data, role: fallbackRole, updated_at: new Date() });
      }
    }
  }

  async archiveUser(id: number): Promise<void> {
    const hasArchivedAt = await knexHasColumn(this.db, 'users', 'archived_at');
    const updatePayload: Record<string, any> = { is_active: false, updated_at: new Date() };
    if (hasArchivedAt) {
      updatePayload['archived_at'] = new Date();
    }
    await this.db('users').where({ id }).update(updatePayload);
  }

  async createAuditLog(data: {
    admin_user_id?: number | null;
    target_user_id: number;
    action: string;
    old_value?: string | null;
    new_value?: string | null;
  }): Promise<void> {
    const hasTable = await this.db.schema.hasTable('audit_logs');
    if (!hasTable) return;
    await this.db('audit_logs').insert({
      admin_user_id: data.admin_user_id || null,
      target_user_id: data.target_user_id,
      action: data.action,
      old_value: data.old_value || null,
      new_value: data.new_value || null,
      created_at: new Date(),
    });
  }

  async getCustomerNotes(customerId: number): Promise<any[]> {
    const hasTable = await this.db.schema.hasTable('customer_notes');
    if (!hasTable) return [];
    const notes = await this.db('customer_notes')
      .leftJoin('users as author', 'customer_notes.author_admin_id', 'author.id')
      .where('customer_notes.customer_id', customerId)
      .select(
        'customer_notes.id',
        'customer_notes.customer_id',
        'customer_notes.author_admin_id',
        'customer_notes.note',
        'customer_notes.created_at',
        'author.name as author_name'
      )
      .orderBy('customer_notes.created_at', 'desc');
    return notes;
  }

  async addCustomerNote(customerId: number, authorAdminId: number | null, note: string): Promise<any> {
    const [noteId] = await this.db('customer_notes').insert({
      customer_id: customerId,
      author_admin_id: authorAdminId,
      note,
      created_at: new Date(),
    });
    const inserted = await this.db('customer_notes')
      .leftJoin('users as author', 'customer_notes.author_admin_id', 'author.id')
      .where('customer_notes.id', noteId)
      .select(
        'customer_notes.id',
        'customer_notes.customer_id',
        'customer_notes.author_admin_id',
        'customer_notes.note',
        'customer_notes.created_at',
        'author.name as author_name'
      )
      .first();
    return inserted;
  }

  async getAllTags(): Promise<any[]> {
    const hasTable = await this.db.schema.hasTable('tags');
    if (!hasTable) return [];
    return this.db('tags').select('*').orderBy('name', 'asc');
  }

  async getCustomerTags(customerId: number): Promise<any[]> {
    const hasTable = await this.db.schema.hasTable('customer_tags');
    if (!hasTable) return [];
    return this.db('customer_tags')
      .join('tags', 'customer_tags.tag_id', 'tags.id')
      .where('customer_tags.customer_id', customerId)
      .select('tags.id', 'tags.name');
  }

  async findOrCreateTag(name: string): Promise<number> {
    const tagName = name.trim();
    const existing = await this.db('tags').where({ name: tagName }).first();
    if (existing) return existing.id;
    const [id] = await this.db('tags').insert({ name: tagName });
    return id!;
  }

  async addCustomerTag(customerId: number, tagId: number): Promise<void> {
    const existing = await this.db('customer_tags')
      .where({ customer_id: customerId, tag_id: tagId })
      .first();
    if (!existing) {
      await this.db('customer_tags').insert({ customer_id: customerId, tag_id: tagId });
    }
  }

  async removeCustomerTag(customerId: number, tagId: number): Promise<void> {
    await this.db('customer_tags').where({ customer_id: customerId, tag_id: tagId }).delete();
  }

  async getCustomerLtvMetrics(customerId: number): Promise<{
    orders_count: number;
    total_spent: number;
    avg_order_value: number;
  }> {
    const hasOrdersTable = await this.db.schema.hasTable('orders');
    if (!hasOrdersTable) {
      return { orders_count: 0, total_spent: 0, avg_order_value: 0 };
    }

    // Exclude cancelled orders
    const validOrders = await this.db('orders')
      .where('user_id', customerId)
      .whereNotIn('status', ['cancelled'])
      .select('id', 'status', 'payment_status', 'total_amount');

    const orders_count = validOrders.length;
    let total_spent = 0;

    for (const ord of validOrders) {
      if (ord.status === 'refunded') {
        // Refunded orders contribute 0 net spent
        continue;
      }
      total_spent += Number(ord.total_amount || 0);
    }

    const avg_order_value = orders_count > 0 ? total_spent / orders_count : 0;

    return {
      orders_count,
      total_spent: Number(total_spent.toFixed(2)),
      avg_order_value: Number(avg_order_value.toFixed(2)),
    };
  }

  async delete(id: number): Promise<void> {
    await this.db('users').where({ id }).delete();
  }
}

async function knexHasColumn(knex: any, table: string, col: string): Promise<boolean> {
  try {
    return await knex.schema.hasColumn(table, col);
  } catch (_e) {
    return false;
  }
}
