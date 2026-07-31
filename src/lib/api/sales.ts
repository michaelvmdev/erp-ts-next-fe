import { http, type Query } from './http';
import type {
  CreateSaleRequest,
  Paginated,
  Sale,
  SaleSummary,
  SearchSalesQuery,
  UpdateSaleRequest,
} from './types';

/** Endpoints de ventas: /sales */
export const salesApi = {
  /** GET /sales (devuelve cabeceras con `lineCount`) */
  list: (query: SearchSalesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<SaleSummary>>('/sales', query as Query, signal),

  /** GET /sales/:saleId (venta completa con sus lineas) */
  get: (saleId: string, signal?: AbortSignal) =>
    http.get<Sale>(`/sales/${saleId}`, undefined, signal),

  /** POST /sales */
  create: (body: CreateSaleRequest, signal?: AbortSignal) =>
    http.post<Sale>('/sales', body, signal),

  /** PATCH /sales/:saleId (corrige cliente, distrito o lineas) */
  update: (saleId: string, body: UpdateSaleRequest, signal?: AbortSignal) =>
    http.patch<Sale>(`/sales/${saleId}`, body, signal),
};
