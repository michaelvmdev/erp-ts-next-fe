import { http, type Query } from './http';
import type {
  CreateLotRequest,
  ListLotsQuery,
  LotDetail,
  LotSummary,
  Paginated,
} from './types';

export const lotsApi = {
  list: (query: ListLotsQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<LotSummary>>('/lots', query as Query, signal),

  get: (id: string, signal?: AbortSignal) =>
    http.get<LotDetail>(`/lots/${id}`, undefined, signal),

  create: (body: CreateLotRequest, signal?: AbortSignal) =>
    http.post<LotDetail>('/lots', body, signal),
};
