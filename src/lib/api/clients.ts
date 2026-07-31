import { http, type Query } from './http';
import type {
  Client,
  CreateClientRequest,
  ListClientsQuery,
  Paginated,
  UpdateClientRequest,
} from './types';

/** Endpoints de clientes: /clients */
export const clientsApi = {
  /** GET /clients */
  list: (query: ListClientsQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<Client>>('/clients', query as Query, signal),

  /** GET /clients/:clientId */
  get: (clientId: string, signal?: AbortSignal) =>
    http.get<Client>(`/clients/${clientId}`, undefined, signal),

  /** POST /clients */
  create: (body: CreateClientRequest, signal?: AbortSignal) =>
    http.post<Client>('/clients', body, signal),

  /** PATCH /clients/:clientId */
  update: (clientId: string, body: UpdateClientRequest, signal?: AbortSignal) =>
    http.patch<Client>(`/clients/${clientId}`, body, signal),
};
