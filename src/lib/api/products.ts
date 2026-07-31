import { http } from './http';
import type {
  CreateProductRequest,
  Paginated,
  Product,
  QueryProductsRequest,
  UpdateProductRequest,
} from './types';

/** Endpoints de productos: /products */
export const productsApi = {
  /** GET /products/:productId */
  get: (productId: string, signal?: AbortSignal) =>
    http.get<Product>(`/products/${productId}`, undefined, signal),

  /** POST /products/query (busqueda con filtros en el cuerpo) */
  query: (body: QueryProductsRequest = {}, signal?: AbortSignal) =>
    http.post<Paginated<Product>>('/products/query', body, signal),

  /** POST /products */
  create: (body: CreateProductRequest, signal?: AbortSignal) =>
    http.post<Product>('/products', body, signal),

  /** PATCH /products/:productId */
  update: (productId: string, body: UpdateProductRequest, signal?: AbortSignal) =>
    http.patch<Product>(`/products/${productId}`, body, signal),

  /** DELETE /products/:productId (baja fisica; 409 si ya tiene ventas) */
  remove: (productId: string, signal?: AbortSignal) =>
    http.delete(`/products/${productId}`, signal),
};
