import { http, type Query } from './http';
import type {
  CreateJournalEntryRequest,
  JournalEntryDetail,
  JournalEntrySummary,
  ListJournalEntriesQuery,
  Paginated,
  Pdt621Report,
} from './types';

export const journalApi = {
  list: (query: ListJournalEntriesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<JournalEntrySummary>>('/journal', query as Query, signal),

  get: (id: string, signal?: AbortSignal) =>
    http.get<JournalEntryDetail>(`/journal/${id}`, undefined, signal),

  create: (body: CreateJournalEntryRequest, signal?: AbortSignal) =>
    http.post<JournalEntryDetail>('/journal', body, signal),
};

export const reportsApi = {
  pdt621: (period: string, signal?: AbortSignal) =>
    http.get<Pdt621Report>('/reports/pdt621', { period } as Query, signal),

  downloadPleVentas: (period: string) => `/reports/ple/ventas?period=${period}`,
  downloadPleCompras: (period: string) => `/reports/ple/compras?period=${period}`,
};
