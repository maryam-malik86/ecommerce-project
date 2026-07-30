import bcrypt from 'bcryptjs';
import type { AuthResponse } from '@ecommerce/shared-types';
import { AuthRepository } from './auth.repository.js';
import { signJwt } from '../../middlewares/jwtAuth.middleware.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

export class AuthService {
  private repo = new AuthRepository();

  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check for duplicate email
    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      throw createApiError(409, 'A user with this email already exists');
    }

    // Hash password with bcrypt (cost factor 12)
    const password_hash = await bcrypt.hash(input.password, 12);

    const userId = await this.repo.create({
      name: input.name,
      email: input.email,
      password_hash,
      role: input.role,
    });

    const user = await this.repo.findById(userId);
    if (!user) throw createApiError(500, 'Failed to retrieve created user');

    const token = signJwt({ sub: user.id, email: user.email, role: user.role });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 7 * 24 * 60 * 60, // 7 days in seconds
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      } as Omit<typeof user, 'password_hash' | 'created_at' | 'updated_at'>,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.repo.findByEmail(input.email);

    // Use constant-time comparison even when user not found to prevent timing attacks
    const dummyHash = '$2a$12$invalidhashtopreventtimingattacks.......................';
    const isValid = await bcrypt.compare(
      input.password,
      user?.password_hash ?? dummyHash,
    );

    if (!user || !isValid || !user.is_active) {
      throw createApiError(401, 'Invalid email or password');
    }

    const token = signJwt({ sub: user.id, email: user.email, role: user.role });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 7 * 24 * 60 * 60,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      } as Omit<typeof user, 'password_hash' | 'created_at' | 'updated_at'>,
    };
  }

  async getProfile(userId: number) {
    const user = await this.repo.findById(userId);
    if (!user) throw createApiError(404, 'User not found');
    const { ...profile } = user;
    return profile;
  }

  async getUsers(search?: string, role?: string) {
    return this.repo.findAll(search, role);
  }

  async updateUser(id: number, input: { name?: string; role?: string; is_active?: boolean; password?: string }) {
    const existing = await this.repo.findById(id);
    if (!existing) throw createApiError(404, `User with id ${id} not found`);
    const updateData: Record<string, any> = {};
    if (input.name) updateData['name'] = input.name;
    if (input.role) updateData['role'] = input.role;
    if (input.is_active !== undefined) updateData['is_active'] = input.is_active;
    if (input.password) updateData['password_hash'] = await bcrypt.hash(input.password, 12);
    await this.repo.update(id, updateData);
    return this.repo.findById(id);
  }

  async deleteUser(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw createApiError(404, `User with id ${id} not found`);
    await this.repo.delete(id);
  }
}
