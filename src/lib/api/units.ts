import { http, type Query } from './http';
import type {
  CreateUnitRequest,
  ListUnitsQuery,
  Paginated,
  Unit,
  UpdateUnitRequest,
} from './types';

export const unitsApi = {
  list: (query: ListUnitsQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<Unit>>('/units', query as Query, signal),

  get: (unitId: string, signal?: AbortSignal) =>
    http.get<Unit>(`/units/${unitId}`, undefined, signal),

  create: (body: CreateUnitRequest, signal?: AbortSignal) =>
    http.post<Unit>('/units', body, signal),

  update: (unitId: string, body: UpdateUnitRequest, signal?: AbortSignal) =>
    http.patch<Unit>(`/units/${unitId}`, body, signal),

  remove: (unitId: string, signal?: AbortSignal) =>
    http.delete(`/units/${unitId}`, signal),
};
