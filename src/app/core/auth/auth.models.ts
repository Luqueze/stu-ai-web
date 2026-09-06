export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: UserResponse;
}

export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
  path: string;
}

export interface StoredAuthSession {
  token: string;
  expiresAt: number;
  user: UserResponse;
}
