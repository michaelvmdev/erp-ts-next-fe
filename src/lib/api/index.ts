/**
 * Punto de entrada del cliente de API.
 *
 * Uso:
 *   import { api } from '@/lib/api';
 *   const page = await api.brands.list({ limit: 10 });
 *
 * o por recurso:
 *   import { brandsApi, ApiError } from '@/lib/api';
 */
export * from './types';
export { http, ApiError, type Query } from './http';

import { brandsApi } from './brands';
import { clientsApi } from './clients';
import { productsApi } from './products';
import { salesApi } from './sales';
import { documentTypesApi, saleTypesApi, healthApi } from './catalogs';
import { ubigeoApi } from './ubigeo';
import { categoriesApi } from './categories';
import { dashboardApi } from './dashboard';

export {
  brandsApi,
  clientsApi,
  productsApi,
  salesApi,
  documentTypesApi,
  saleTypesApi,
  healthApi,
  ubigeoApi,
  categoriesApi,
  dashboardApi,
};

/** Cliente agrupado por dominio, espejo de los recursos del backend. */
export const api = {
  brands: brandsApi,
  clients: clientsApi,
  products: productsApi,
  sales: salesApi,
  documentTypes: documentTypesApi,
  saleTypes: saleTypesApi,
  health: healthApi,
  ubigeo: ubigeoApi,
  categories: categoriesApi,
  dashboard: dashboardApi,
};
