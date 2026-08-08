import { http, type Query } from './http';
import type {
  CreateCreditNoteRequest,
  CreditNoteDetail,
  CreditNoteSummary,
  ListCreditNotesQuery,
  Paginated,
} from './types';

export const creditNotesApi = {
  list: (query: ListCreditNotesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<CreditNoteSummary>>('/credit-notes', query as Query, signal),

  get: (id: string, signal?: AbortSignal) =>
    http.get<CreditNoteDetail>(`/credit-notes/${id}`, undefined, signal),

  create: (body: CreateCreditNoteRequest, signal?: AbortSignal) =>
    http.post<CreditNoteDetail>('/credit-notes', body, signal),
};
