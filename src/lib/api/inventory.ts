import { http, type Query } from './http';
import type {
  ListStockBalancesQuery,
  ListStockMovementsQuery,
  Paginated,
  StockAlert,
  StockBalance,
  StockMovement,
} from './types';

export const inventoryApi = {
  listBalances: (query: ListStockBalancesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<StockBalance>>('/stock', query as Query, signal),

  listMovements: (query: ListStockMovementsQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<StockMovement>>('/stock/movements', query as Query, signal),

  alerts: (signal?: AbortSignal) =>
    http.get<StockAlert[]>('/stock/alerts', undefined, signal),
};
