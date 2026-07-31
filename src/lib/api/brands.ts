import { http, type Query } from './http';
import type {
  Brand,
  CreateBrandRequest,
  ListBrandsQuery,
  Paginated,
  UpdateBrandRequest,
} from './types';

/** Endpoints de marcas: /brands */
export const brandsApi = {
  /** GET /brands */
  list: (query: ListBrandsQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<Brand>>('/brands', query as Query, signal),

  /** GET /brands/:brandId */
  get: (brandId: string, signal?: AbortSignal) =>
    http.get<Brand>(`/brands/${brandId}`, undefined, signal),

  /** POST /brands */
  create: (body: CreateBrandRequest, signal?: AbortSignal) =>
    http.post<Brand>('/brands', body, signal),

  /** PATCH /brands/:brandId (tambien desactiva con `{ brandActive: false }`) */
  update: (brandId: string, body: UpdateBrandRequest, signal?: AbortSignal) =>
    http.patch<Brand>(`/brands/${brandId}`, body, signal),
};
