import { http } from './http';
import type { DocumentType, HealthStatus, SaleType } from './types';

/** Catalogo de tipos de documento: /document-types */
export const documentTypesApi = {
  /** GET /document-types (arreglo plano, sin paginado) */
  list: (signal?: AbortSignal) =>
    http.get<DocumentType[]>('/document-types', undefined, signal),
};

/** Catalogo de tipos de comprobante: /sale-types */
export const saleTypesApi = {
  /** GET /sale-types (arreglo plano, sin paginado) */
  list: (signal?: AbortSignal) =>
    http.get<SaleType[]>('/sale-types', undefined, signal),
};

/** Sondas de salud: /health */
export const healthApi = {
  /** GET /health/db */
  db: (signal?: AbortSignal) =>
    http.get<HealthStatus>('/health/db', undefined, signal),
};
