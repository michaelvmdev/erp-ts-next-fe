import { http, type Query } from './http';
import type { AuditEntry, AuditListQuery } from './types';

export const auditApi = {
  list: (query: AuditListQuery = {}, signal?: AbortSignal) =>
    http.get<{ items: AuditEntry[]; total: number }>('/audit', query as Query, signal),
};
