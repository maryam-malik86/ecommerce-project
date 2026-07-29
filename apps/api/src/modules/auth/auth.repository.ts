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
}
