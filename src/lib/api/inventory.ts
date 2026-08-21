import { http, type Query } from './http';
import type {
  ListStockBalancesQuery,
  ListStockMovementsQuery,
  Paginated,
  StockAlert,
  StockBalance,
  StockMovement,
} from './types';

export interface GeneratePosResult {
  created: Array<{ purchaseOrderId: string; supplierId: string; items: number }>;
  skipped: Array<{ productId: string; productName: string; reason: string }>;
}

export const inventoryApi = {
  listBalances: (query: ListStockBalancesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<StockBalance>>('/stock', query as Query, signal),

  listMovements: (query: ListStockMovementsQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<StockMovement>>('/stock/movements', query as Query, signal),

  alerts: (signal?: AbortSignal) =>
    http.get<StockAlert[]>('/stock/alerts', undefined, signal),

  getAlerts: (signal?: AbortSignal) =>
    http.get<StockAlert[]>('/stock/alerts', undefined, signal),

  notifyAlerts: () =>
    http.post<void>('/stock/alerts/notify', {}),

  generatePos: () =>
    http.post<GeneratePosResult>('/stock/alerts/generate-pos', {}),
};
