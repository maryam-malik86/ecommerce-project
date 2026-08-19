export interface EmailTemplate {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  subject: string;
  html_content: string;
  text_content?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
