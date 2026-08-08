import { http, type Query } from './http';
import type {
  CreatePriceListRequest,
  ListPriceListsQuery,
  Paginated,
  PriceList,
  PriceListItem,
  UpdatePriceListItemsRequest,
  UpdatePriceListRequest,
} from './types';

export const priceListsApi = {
  list: (query: ListPriceListsQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<PriceList>>('/price-lists', query as Query, signal),

  get: (priceListId: string, signal?: AbortSignal) =>
    http.get<PriceList>(`/price-lists/${priceListId}`, undefined, signal),

  create: (body: CreatePriceListRequest, signal?: AbortSignal) =>
    http.post<PriceList>('/price-lists', body, signal),

  update: (priceListId: string, body: UpdatePriceListRequest, signal?: AbortSignal) =>
    http.patch<PriceList>(`/price-lists/${priceListId}`, body, signal),

  getItems: (priceListId: string, signal?: AbortSignal) =>
    http.get<PriceListItem[]>(`/price-lists/${priceListId}/items`, undefined, signal),

  updateItems: (priceListId: string, body: UpdatePriceListItemsRequest, signal?: AbortSignal) =>
    http.put<PriceListItem[]>(`/price-lists/${priceListId}/items`, body, signal),
};
