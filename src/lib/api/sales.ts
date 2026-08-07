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

  /** GET /sales/report?from=...&to=... (devuelve PDF en base64, misma forma que SalePdf) */
  report: (from: string, to: string, signal?: AbortSignal) =>
    http.get<SalePdf>('/sales/report', { from, to }, signal),

  /** POST /sales/report/send-email?email=...&from=...&to=... */
  sendReportEmail: (email: string, from: string, to: string, signal?: AbortSignal) =>
    http.post<{ message: string }>(
      `/sales/report/send-email?${new URLSearchParams({ email, from, to })}`,
      undefined,
      signal,
    ),

  /** GET /sales/products-report?from=...&to=...&orderBy=amount|quantity */
  productsReport: (from: string, to: string, orderBy: 'amount' | 'quantity', signal?: AbortSignal) =>
    http.get<SalePdf>('/sales/products-report', { from, to, orderBy }, signal),

  /** POST /sales/products-report/send-email?email=...&from=...&to=...&orderBy=... */
  sendProductsReportEmail: (email: string, from: string, to: string, orderBy: 'amount' | 'quantity', signal?: AbortSignal) =>
    http.post<{ message: string }>(
      `/sales/products-report/send-email?${new URLSearchParams({ email, from, to, orderBy })}`,
      undefined,
      signal,
    ),

  /** GET /sales/clients-amount-report?from=...&to=... */
  clientsAmountReport: (from: string, to: string, signal?: AbortSignal) =>
    http.get<SalePdf>('/sales/clients-amount-report', { from, to }, signal),

  /** POST /sales/clients-amount-report/send-email?email=...&from=...&to=... */
  sendClientsAmountReportEmail: (email: string, from: string, to: string, signal?: AbortSignal) =>
    http.post<{ message: string }>(
      `/sales/clients-amount-report/send-email?${new URLSearchParams({ email, from, to })}`,
      undefined,
      signal,
    ),

  /** GET /sales/sales-by-client-report?clientId=UUID&from=...&to=... */
  salesByClientReport: (clientId: string, from: string, to: string, signal?: AbortSignal) =>
    http.get<SalePdf>('/sales/sales-by-client-report', { clientId, from, to }, signal),

  /** POST /sales/sales-by-client-report/send-email?email=...&clientId=UUID&from=...&to=... */
  sendSalesByClientReportEmail: (email: string, clientId: string, from: string, to: string, signal?: AbortSignal) =>
    http.post<{ message: string }>(
      `/sales/sales-by-client-report/send-email?${new URLSearchParams({ email, clientId, from, to })}`,
      undefined,
      signal,
    ),
};
