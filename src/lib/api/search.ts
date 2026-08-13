import { http } from './http';
import type { SearchResult } from './types';

export const searchApi = {
  search: (q: string, signal?: AbortSignal) =>
    http.get<SearchResult[]>('/search', { q }, signal),
};
