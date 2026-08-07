import { http, type Query } from './http';
import type {
  CreatePurchaseRequest,
  Paginated,
  Purchase,
  PurchaseSummary,
  SalePdf,
  SearchPurchasesQuery,
  UpdatePurchaseRequest,
} from './types';

/** Endpoints de compras: /purchases */
export const purchasesApi = {
  /** GET /purchases */
  list: (query: SearchPurchasesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<PurchaseSummary>>('/purchases', query as Query, signal),

  /** GET /purchases/:purchaseId */
  get: (purchaseId: string, signal?: AbortSignal) =>
    http.get<Purchase>(`/purchases/${purchaseId}`, undefined, signal),

  /** POST /purchases */
  create: (body: CreatePurchaseRequest, signal?: AbortSignal) =>
    http.post<Purchase>('/purchases', body, signal),

  /** PATCH /purchases/:purchaseId */
  update: (purchaseId: string, body: UpdatePurchaseRequest, signal?: AbortSignal) =>
    http.patch<Purchase>(`/purchases/${purchaseId}`, body, signal),

  /** GET /purchases/suppliers-amount-report?from=...&to=... */
  suppliersAmountReport: (from: string, to: string, signal?: AbortSignal) =>
    http.get<SalePdf>('/purchases/suppliers-amount-report', { from, to }, signal),

  /** POST /purchases/suppliers-amount-report/send-email?email=...&from=...&to=... */
  sendSuppliersAmountReportEmail: (email: string, from: string, to: string, signal?: AbortSignal) =>
    http.post<{ message: string }>(
      `/purchases/suppliers-amount-report/send-email?${new URLSearchParams({ email, from, to })}`,
      undefined,
      signal,
    ),

  /** GET /purchases/purchases-by-supplier-report?supplierId=UUID&from=...&to=... */
  purchasesBySupplierReport: (supplierId: string, from: string, to: string, signal?: AbortSignal) =>
    http.get<SalePdf>('/purchases/purchases-by-supplier-report', { supplierId, from, to }, signal),

  /** POST /purchases/purchases-by-supplier-report/send-email?email=...&supplierId=UUID&from=...&to=... */
  sendPurchasesBySupplierReportEmail: (email: string, supplierId: string, from: string, to: string, signal?: AbortSignal) =>
    http.post<{ message: string }>(
      `/purchases/purchases-by-supplier-report/send-email?${new URLSearchParams({ email, supplierId, from, to })}`,
      undefined,
      signal,
    ),
};
