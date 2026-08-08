import { http, type Query } from './http';
import type {
  CreatePurchaseOrderRequest,
  ListPurchaseOrdersQuery,
  Paginated,
  PurchaseOrderDetail,
  PurchaseOrderSummary,
  UpdatePurchaseOrderRequest,
} from './types';

export const purchaseOrdersApi = {
  list: (query: ListPurchaseOrdersQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<PurchaseOrderSummary>>('/purchase-orders', query as Query, signal),

  get: (id: string, signal?: AbortSignal) =>
    http.get<PurchaseOrderDetail>(`/purchase-orders/${id}`, undefined, signal),

  create: (body: CreatePurchaseOrderRequest, signal?: AbortSignal) =>
    http.post<PurchaseOrderDetail>('/purchase-orders', body, signal),

  update: (id: string, body: UpdatePurchaseOrderRequest, signal?: AbortSignal) =>
    http.patch<PurchaseOrderDetail>(`/purchase-orders/${id}`, body, signal),
};
