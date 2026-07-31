import { z } from 'zod';

export const CreateRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  badge_color: z.string().optional().default('indigo'),
  permission_codes: z.array(z.string()).optional().default([]),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  badge_color: z.string().optional(),
  permission_codes: z.array(z.string()).optional(),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
