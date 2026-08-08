import { http, type Query } from './http';
import type {
  CreatePaymentRequest,
  ListPaymentsQuery,
  Paginated,
  PaymentItem,
} from './types';

export const paymentsApi = {
  list: (query: ListPaymentsQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<PaymentItem>>('/payments', query as Query, signal),

  create: (body: CreatePaymentRequest, signal?: AbortSignal) =>
    http.post<PaymentItem>('/payments', body, signal),

  remove: (id: string, signal?: AbortSignal) =>
    http.delete(`/payments/${id}`, signal),
};
