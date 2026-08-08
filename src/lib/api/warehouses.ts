import { http, type Query } from './http';
import type {
  CreateWarehouseRequest,
  ListWarehousesQuery,
  Paginated,
  UpdateWarehouseRequest,
  Warehouse,
} from './types';

export const warehousesApi = {
  list: (query: ListWarehousesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<Warehouse>>('/warehouses', query as Query, signal),

  get: (warehouseId: string, signal?: AbortSignal) =>
    http.get<Warehouse>(`/warehouses/${warehouseId}`, undefined, signal),

  create: (body: CreateWarehouseRequest, signal?: AbortSignal) =>
    http.post<Warehouse>('/warehouses', body, signal),

  update: (warehouseId: string, body: UpdateWarehouseRequest, signal?: AbortSignal) =>
    http.patch<Warehouse>(`/warehouses/${warehouseId}`, body, signal),

  remove: (warehouseId: string, signal?: AbortSignal) =>
    http.delete(`/warehouses/${warehouseId}`, signal),
};
