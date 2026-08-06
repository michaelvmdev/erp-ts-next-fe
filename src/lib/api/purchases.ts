import { http, type Query } from './http';
import type {
  CreatePurchaseRequest,
  Paginated,
  Purchase,
  PurchaseSummary,
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
};
