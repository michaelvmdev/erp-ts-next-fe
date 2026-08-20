import { http, type Query } from './http';
import type {
  CreateQuoteRequest,
  ListQuotesQuery,
  Paginated,
  QuoteDetail,
  QuoteSummary,
  UpdateQuoteStatusRequest,
} from './types';

export const quotesApi = {
  list: (query: ListQuotesQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<QuoteSummary>>('/quotes', query as Query, signal),

  get: (id: string, signal?: AbortSignal) =>
    http.get<QuoteDetail>(`/quotes/${id}`, undefined, signal),

  create: (body: CreateQuoteRequest, signal?: AbortSignal) =>
    http.post<QuoteDetail>('/quotes', body, signal),

  updateStatus: (id: string, body: UpdateQuoteStatusRequest, signal?: AbortSignal) =>
    http.patch<QuoteDetail>(`/quotes/${id}/status`, body, signal),
};
