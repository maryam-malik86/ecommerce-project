import type { Request, Response, NextFunction } from 'express';
import { RolesService } from './roles.service.js';
import { CreateRoleSchema, UpdateRoleSchema } from './roles.schemas.js';

const rolesService = new RolesService();

export class RolesController {
  async getRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await rolesService.getRoles();
      res.json({ success: true, message: 'Roles retrieved', data });
    } catch (err) { next(err); }
  }

  async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const data = await rolesService.getRoleById(id);
      res.json({ success: true, message: 'Role retrieved', data });
    } catch (err) { next(err); }
  }

  async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateRoleSchema.parse(req.body);
      const data = await rolesService.createRole(input);
      res.status(201).json({ success: true, message: 'Role created', data });
    } catch (err) { next(err); }
  }

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const input = UpdateRoleSchema.parse(req.body);
      const data = await rolesService.updateRole(id, input);
      res.json({ success: true, message: 'Role updated', data });
    } catch (err) { next(err); }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      await rolesService.deleteRole(id);
      res.json({ success: true, message: 'Role deleted', data: null });
    } catch (err) { next(err); }
  }

  async getPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await rolesService.getPermissions();
      res.json({ success: true, message: 'Permissions retrieved', data });
    } catch (err) { next(err); }
  }
}
