import { http, type Query } from './http';
import type {
  CreateUserEcommerceRequest,
  ListUsersEcommerceQuery,
  Paginated,
  UpdateUserEcommerceRequest,
  UserEcommerce,
  UserPurchaseHistoryItem,
} from './types';

export const usersEcommerceApi = {
  list: (query: ListUsersEcommerceQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<UserEcommerce>>('/users-ecommerce', query as Query, signal),

  get: (id: string, signal?: AbortSignal) =>
    http.get<UserEcommerce>(`/users-ecommerce/${id}`, undefined, signal),

  create: (body: CreateUserEcommerceRequest, signal?: AbortSignal) =>
    http.post<UserEcommerce>('/users-ecommerce', body, signal),

  update: (id: string, body: UpdateUserEcommerceRequest, signal?: AbortSignal) =>
    http.patch<UserEcommerce>(`/users-ecommerce/${id}`, body, signal),

  delete: (id: string, signal?: AbortSignal) =>
    http.delete<void>(`/users-ecommerce/${id}`, signal),

  history: (id: string, signal?: AbortSignal) =>
    http.get<UserPurchaseHistoryItem[]>(`/users-ecommerce/${id}/history`, undefined, signal),
};
