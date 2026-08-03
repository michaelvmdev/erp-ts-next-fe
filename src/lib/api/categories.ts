import { http, type Query } from './http';
import type { Category, ListCategoriesQuery, Paginated } from './types';

/** Endpoints de categorias: /categories */
export const categoriesApi = {
  /** GET /categories */
  list: (query: ListCategoriesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<Category>>('/categories', query as Query, signal),

  /** GET /categories/:categoryId */
  get: (categoryId: string, signal?: AbortSignal) =>
    http.get<Category>(`/categories/${categoryId}`, undefined, signal),
};
