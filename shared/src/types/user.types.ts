export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  role: 'admin' | 'user' | 'agency';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  role: 'admin' | 'user' | 'agency';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
}
