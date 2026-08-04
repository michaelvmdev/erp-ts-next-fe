import { http, type Query } from './http';
import type {
  Category,
  CreateCategoryRequest,
  ListCategoriesQuery,
  Paginated,
  UpdateCategoryRequest,
} from './types';

/** Endpoints de categorias: /categories */
export const categoriesApi = {
  /** GET /categories */
  list: (query: ListCategoriesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<Category>>('/categories', query as Query, signal),

  /** GET /categories/:categoryId */
  get: (categoryId: string, signal?: AbortSignal) =>
    http.get<Category>(`/categories/${categoryId}`, undefined, signal),

  /** POST /categories */
  create: (body: CreateCategoryRequest, signal?: AbortSignal) =>
    http.post<Category>('/categories', body, signal),

  /** PATCH /categories/:categoryId */
  update: (categoryId: string, body: UpdateCategoryRequest, signal?: AbortSignal) =>
    http.patch<Category>(`/categories/${categoryId}`, body, signal),

  /** DELETE /categories/:categoryId */
  remove: (categoryId: string, signal?: AbortSignal) =>
    http.delete(`/categories/${categoryId}`, signal),
};
