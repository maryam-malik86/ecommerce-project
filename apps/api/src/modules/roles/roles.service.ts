import { RolesRepository } from './roles.repository.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import type { CreateRoleInput, UpdateRoleInput } from './roles.schemas.js';

export class RolesService {
  private repo = new RolesRepository();

  async getRoles() {
    return this.repo.findAllRoles();
  }

  async getRoleById(id: number) {
    const role = await this.repo.findRoleById(id);
    if (!role) throw createApiError(404, 'Role not found');
    return role;
  }

  async createRole(input: CreateRoleInput) {
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const existing = await this.repo.findRoleBySlug(slug);
    if (existing) throw createApiError(409, 'Role with similar name already exists');

    return this.repo.createRole({
      name: input.name,
      slug,
      description: input.description,
      badge_color: input.badge_color,
      permission_codes: input.permission_codes,
    });
  }

  async updateRole(id: number, input: UpdateRoleInput) {
    const existing = await this.repo.findRoleById(id);
    if (!existing) throw createApiError(404, 'Role not found');

    return this.repo.updateRole(id, input);
  }

  async deleteRole(id: number) {
    const existing = await this.repo.findRoleById(id);
    if (!existing) throw createApiError(404, 'Role not found');
    if (existing.is_system) throw createApiError(400, 'System default roles cannot be deleted');

    const success = await this.repo.deleteRole(id);
    if (!success) throw createApiError(500, 'Failed to delete role');
    return true;
  }

  async getPermissions() {
    return this.repo.findAllPermissions();
  }

  async getUserPermissions(userId: number) {
    return this.repo.getUserPermissions(userId);
  }
}
