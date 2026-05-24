import { apiClient } from '@/lib/api/client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types/auth';

export const authApi = {
  login(data: LoginRequest) {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: data,
      auth: false,
    });
  },

  register(data: RegisterRequest) {
    return apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: data,
      auth: false,
    });
  },

  me() {
    return apiClient<User>('/auth/me');
  },
};
