import { http, type Query } from './http';
import type {
  CreateSaleRequest,
  Paginated,
  Sale,
  SaleEmailResult,
  SalePdf,
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

  /** GET /sales/:saleId/pdf (comprobante en PDF, base64) */
  pdf: (saleId: string, signal?: AbortSignal) =>
    http.get<SalePdf>(`/sales/${saleId}/pdf`, undefined, signal),

  /** POST /sales/:saleId/send-email (adjunta el PDF al correo) */
  sendEmail: (saleId: string, email: string, signal?: AbortSignal) =>
    http.post<SaleEmailResult>(`/sales/${saleId}/send-email`, { email }, signal),
};
