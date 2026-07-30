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

  async create(data: {
    name: string;
    email: string;
    password_hash: string;
    role: string;
  }): Promise<number> {
    const [id] = await this.db('users').insert({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return id as number;
  }

  async findAll(search?: string, role?: string): Promise<User[]> {
    let q = this.db('users').select('id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at').orderBy('id', 'desc');
    if (search) q = q.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`);
    if (role) q = q.where({ role });
    return q as Promise<User[]>;
  }

  async update(id: number, data: Partial<User>): Promise<void> {
    await this.db('users').where({ id }).update({ ...data, updated_at: new Date() });
  }

  async delete(id: number): Promise<void> {
    await this.db('users').where({ id }).delete();
  }
}
