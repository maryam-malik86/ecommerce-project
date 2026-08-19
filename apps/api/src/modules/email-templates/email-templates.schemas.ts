import { z } from 'zod';

export const UpdateEmailTemplateSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  html_content: z.string().min(1, 'HTML content is required'),
  text_content: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const TestSendEmailSchema = z.object({
  to: z.string().email('Valid recipient email address required'),
});

export type UpdateEmailTemplateInput = z.infer<typeof UpdateEmailTemplateSchema>;
export type TestSendEmailInput = z.infer<typeof TestSendEmailSchema>;
