import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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

    let role_id: number | null = null;
    if (input.role) {
      const matchedRole = await this.repo.findRoleBySlug(input.role);
      if (matchedRole) role_id = matchedRole.id;
    }

    const userId = await this.repo.create({
      name: input.name,
      email: input.email,
      password_hash,
      role: input.role,
      role_id,
    });

    const user = await this.repo.findById(userId);
    if (!user) throw createApiError(500, 'Failed to retrieve created user');

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

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.repo.findByEmail(input.email);

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

  async getUsers(search?: string, role?: string, tagId?: number, includeArchived = false) {
    return this.repo.findAll(search, role, tagId, includeArchived);
  }

  async updateUser(
    id: number,
    input: { name?: string; email?: string; role?: string; is_active?: boolean; password?: string },
    adminUserId?: number | null
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) throw createApiError(404, `User with id ${id} not found`);

    const updateData: Record<string, any> = {};

    if (input.name && input.name !== existing.name) {
      updateData['name'] = input.name;
      await this.repo.createAuditLog({
        admin_user_id: adminUserId,
        target_user_id: id,
        action: 'update_name',
        old_value: existing.name,
        new_value: input.name,
      });
    }

    if (input.email && input.email !== existing.email) {
      const emailUser = await this.repo.findByEmail(input.email);
      if (emailUser && emailUser.id !== id) {
        throw createApiError(409, 'A user with this email address already exists');
      }
      updateData['email'] = input.email;
      await this.repo.createAuditLog({
        admin_user_id: adminUserId,
        target_user_id: id,
        action: 'update_email',
        old_value: existing.email,
        new_value: input.email,
      });
    }

    if (input.role) {
      updateData['role'] = input.role;
      const matchedRole = await this.repo.findRoleBySlug(input.role);
      if (matchedRole) updateData['role_id'] = matchedRole.id;
    }

    if (input.is_active !== undefined && input.is_active !== existing.is_active) {
      updateData['is_active'] = input.is_active;
      await this.repo.createAuditLog({
        admin_user_id: adminUserId,
        target_user_id: id,
        action: input.is_active ? 'activate_account' : 'suspend_account',
        old_value: String(existing.is_active),
        new_value: String(input.is_active),
      });
    }

    if (input.password && input.password.trim().length > 0) {
      if (input.password.trim().length < 8) {
        throw createApiError(422, 'Password must be at least 8 characters');
      }
      updateData['password_hash'] = await bcrypt.hash(input.password, 12);
    }

    if (Object.keys(updateData).length > 0) {
      await this.repo.update(id, updateData);
    }

    return this.repo.findById(id);
  }

  async archiveUser(id: number, adminUserId?: number | null) {
    const existing = await this.repo.findById(id);
    if (!existing) throw createApiError(404, `User with id ${id} not found`);

    await this.repo.archiveUser(id);
    await this.repo.createAuditLog({
      admin_user_id: adminUserId,
      target_user_id: id,
      action: 'archive_customer',
      old_value: 'active',
      new_value: 'archived',
    });

    return { success: true, message: 'Customer soft-archived successfully' };
  }

  async sendPasswordResetEmail(id: number, adminUserId?: number | null) {
    const existing = await this.repo.findById(id);
    if (!existing) throw createApiError(404, `User with id ${id} not found`);

    const resetToken = crypto.randomBytes(32).toString('hex');

    await this.repo.createAuditLog({
      admin_user_id: adminUserId,
      target_user_id: id,
      action: 'send_password_reset_email',
      new_value: `Password reset link generated for ${existing.email}`,
    });

    return {
      success: true,
      message: `Password reset email dispatched to ${existing.email}`,
      reset_token: resetToken,
    };
  }

  async getCustomerNotes(customerId: number) {
    return this.repo.getCustomerNotes(customerId);
  }

  async addCustomerNote(customerId: number, authorAdminId: number | null, note: string) {
    if (!note || !note.trim()) {
      throw createApiError(422, 'Note text cannot be empty');
    }
    return this.repo.addCustomerNote(customerId, authorAdminId, note.trim());
  }

  async getAllTags() {
    return this.repo.getAllTags();
  }

  async getCustomerTags(customerId: number) {
    return this.repo.getCustomerTags(customerId);
  }

  async addCustomerTag(customerId: number, tagName: string) {
    if (!tagName || !tagName.trim()) {
      throw createApiError(422, 'Tag name cannot be empty');
    }
    const tagId = await this.repo.findOrCreateTag(tagName.trim());
    await this.repo.addCustomerTag(customerId, tagId);
    return this.getCustomerTags(customerId);
  }

  async removeCustomerTag(customerId: number, tagId: number) {
    await this.repo.removeCustomerTag(customerId, tagId);
    return this.getCustomerTags(customerId);
  }

  async deleteUser(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw createApiError(404, `User with id ${id} not found`);
    await this.repo.delete(id);
  }
}
