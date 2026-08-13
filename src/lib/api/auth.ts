import { http, type Query } from './http';
import type {
  AuthTokenResponse,
  ListUsersQuery,
  LoginRequest,
  Paginated,
  RegisterRequest,
  RoleItem,
  UpdateUserRequest,
  UserItem,
} from './types';

export const authApi = {
  login: (body: LoginRequest, signal?: AbortSignal) =>
    http.post<AuthTokenResponse>('/auth/login', body, signal),

  register: (body: RegisterRequest, signal?: AbortSignal) =>
    http.post<UserItem>('/auth/register', body, signal),

  me: (signal?: AbortSignal) =>
    http.get<UserItem>('/auth/me', undefined, signal),

  forgotPassword: (email: string, signal?: AbortSignal) =>
    http.post<void>('/auth/forgot-password', { email }, signal),

  resetPassword: (token: string, newPassword: string, signal?: AbortSignal) =>
    http.post<void>('/auth/reset-password', { token, newPassword }, signal),
};

export const usersApi = {
  list: (query: ListUsersQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<UserItem>>('/users', query as Query, signal),

  update: (id: string, body: UpdateUserRequest, signal?: AbortSignal) =>
    http.patch<UserItem>(`/users/${id}`, body, signal),
};

export const rolesApi = {
  list: (signal?: AbortSignal) =>
    http.get<RoleItem[]>('/roles', undefined, signal),
};
