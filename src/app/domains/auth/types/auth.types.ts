export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}