import { http, type Query } from './http';
import type {
  CreateSupplierRequest,
  ListSuppliersQuery,
  Paginated,
  Supplier,
  UpdateSupplierRequest,
} from './types';

/** Endpoints de proveedores: /suppliers */
export const suppliersApi = {
  /** GET /suppliers */
  list: (query: ListSuppliersQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<Supplier>>('/suppliers', query as Query, signal),

  /** GET /suppliers/:supplierId */
  get: (supplierId: string, signal?: AbortSignal) =>
    http.get<Supplier>(`/suppliers/${supplierId}`, undefined, signal),

  /** POST /suppliers */
  create: (body: CreateSupplierRequest, signal?: AbortSignal) =>
    http.post<Supplier>('/suppliers', body, signal),

  /** PATCH /suppliers/:supplierId */
  update: (supplierId: string, body: UpdateSupplierRequest, signal?: AbortSignal) =>
    http.patch<Supplier>(`/suppliers/${supplierId}`, body, signal),

  /** DELETE /suppliers/:supplierId */
  remove: (supplierId: string, signal?: AbortSignal) =>
    http.delete(`/suppliers/${supplierId}`, signal),
};
