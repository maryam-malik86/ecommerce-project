import { getDb } from '../../config/db.js';

export interface RoleRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  badge_color: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionRow {
  id: number;
  code: string;
  label: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends RoleRow {
  permissions: PermissionRow[];
}

export class RolesRepository {
  private get db() {
    return getDb();
  }

  async findAllRoles(): Promise<RoleWithPermissions[]> {
    const roles = await this.db<RoleRow>('roles').select('*').orderBy('id', 'asc');
    const result: RoleWithPermissions[] = [];

    for (const role of roles) {
      const perms = await this.db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where('role_permissions.role_id', role.id)
        .select('permissions.*');
      result.push({ ...role, permissions: perms });
    }

    return result;
  }

  async findRoleById(id: number): Promise<RoleWithPermissions | null> {
    const role = await this.db<RoleRow>('roles').where({ id }).first();
    if (!role) return null;

    const perms = await this.db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', role.id)
      .select('permissions.*');

    return { ...role, permissions: perms };
  }

  async findRoleBySlug(slug: string): Promise<RoleRow | null> {
    const role = await this.db<RoleRow>('roles').where({ slug }).first();
    return role ?? null;
  }

  async createRole(data: {
    name: string;
    slug: string;
    description?: string;
    badge_color?: string;
    is_system?: boolean;
    permission_codes?: string[];
  }): Promise<RoleWithPermissions> {
    const [roleId] = await this.db('roles').insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      badge_color: data.badge_color || 'indigo',
      is_system: data.is_system ?? false,
    });

    if (data.permission_codes && data.permission_codes.length > 0) {
      const perms = await this.db<PermissionRow>('permissions')
        .whereIn('code', data.permission_codes)
        .select('id');

      const rolePerms = perms.map((p) => ({
        role_id: roleId!,
        permission_id: p.id,
      }));

      if (rolePerms.length > 0) {
        await this.db('role_permissions').insert(rolePerms);
      }
    }

    return (await this.findRoleById(roleId!))!;
  }

  async updateRole(
    id: number,
    data: {
      name?: string;
      description?: string;
      badge_color?: string;
      permission_codes?: string[];
    }
  ): Promise<RoleWithPermissions | null> {
    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.description !== undefined) updatePayload['description'] = data.description;
    if (data.badge_color !== undefined) updatePayload['badge_color'] = data.badge_color;
    updatePayload['updated_at'] = this.db.fn.now();

    if (Object.keys(updatePayload).length > 0) {
      await this.db('roles').where({ id }).update(updatePayload);
    }

    if (data.permission_codes !== undefined) {
      await this.db('role_permissions').where({ role_id: id }).delete();

      if (data.permission_codes.length > 0) {
        const perms = await this.db<PermissionRow>('permissions')
          .whereIn('code', data.permission_codes)
          .select('id');

        const rolePerms = perms.map((p) => ({
          role_id: id,
          permission_id: p.id,
        }));

        if (rolePerms.length > 0) {
          await this.db('role_permissions').insert(rolePerms);
        }
      }
    }

    return this.findRoleById(id);
  }

  async deleteRole(id: number): Promise<boolean> {
    const deleted = await this.db('roles').where({ id, is_system: false }).delete();
    return deleted > 0;
  }

  async findAllPermissions(): Promise<PermissionRow[]> {
    return this.db<PermissionRow>('permissions').select('*').orderBy('category', 'asc');
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.db('users').where({ id: userId }).select('role_id', 'role').first();
    if (!user) return [];

    let roleId = user.role_id;
    if (!roleId && user.role) {
      const matchedRole = await this.db('roles').where({ slug: user.role }).first();
      if (matchedRole) roleId = matchedRole.id;
    }

    if (!roleId) return [];

    const perms = await this.db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', roleId)
      .select('permissions.code');

    return perms.map((p) => p.code);
  }
}
