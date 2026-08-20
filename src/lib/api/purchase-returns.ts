import { http, type Query } from './http';
import type {
  CreatePurchaseReturnRequest,
  ListPurchaseReturnsQuery,
  Paginated,
  PurchaseReturnDetail,
  PurchaseReturnSummary,
} from './types';

export const purchaseReturnsApi = {
  list: (query: ListPurchaseReturnsQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<PurchaseReturnSummary>>('/purchase-returns', query as Query, signal),

  get: (id: string, signal?: AbortSignal) =>
    http.get<PurchaseReturnDetail>(`/purchase-returns/${id}`, undefined, signal),

  create: (body: CreatePurchaseReturnRequest, signal?: AbortSignal) =>
    http.post<PurchaseReturnDetail>('/purchase-returns', body, signal),
};
