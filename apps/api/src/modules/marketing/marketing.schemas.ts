import { z } from 'zod';

export const SubscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().max(150).optional(),
});

export const BroadcastSchema = z.object({
  subject: z.string().min(1).max(300),
  html: z.string().min(1),
  text: z.string().optional(),
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;
export type BroadcastInput = z.infer<typeof BroadcastSchema>;
