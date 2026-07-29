// ─── User & Auth Types ───────────────────────────────────────────────────────

export type UserRole = 'admin' | 'customer' | 'supplier';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApiClient {
  id: number;
  name: string;
  api_key: string;
  allowed_origins: string; // JSON array string of allowed CORS origins
  is_active: boolean;
  created_at: Date;
}

// ─── Auth DTOs ───────────────────────────────────────────────────────────────

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  sub: number;       // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds
  user: Omit<User, 'created_at' | 'updated_at' | 'password_hash'>;
}
