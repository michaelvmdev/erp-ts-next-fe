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
import { suppliersApi } from './suppliers';
import { purchasesApi } from './purchases';
import { unitsApi } from './units';
import { warehousesApi } from './warehouses';
import { priceListsApi } from './price-lists';
import { inventoryApi } from './inventory';
import { creditNotesApi } from './credit-notes';
import { purchaseOrdersApi } from './purchase-orders';
import { paymentsApi } from './payments';
import { authApi, usersApi, rolesApi } from './auth';

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
  suppliersApi,
  purchasesApi,
  unitsApi,
  warehousesApi,
  priceListsApi,
  inventoryApi,
  creditNotesApi,
  purchaseOrdersApi,
  paymentsApi,
  authApi,
  usersApi,
  rolesApi,
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
  suppliers: suppliersApi,
  purchases: purchasesApi,
  units: unitsApi,
  warehouses: warehousesApi,
  priceLists: priceListsApi,
  inventory: inventoryApi,
  creditNotes: creditNotesApi,
  purchaseOrders: purchaseOrdersApi,
  payments: paymentsApi,
  auth: authApi,
  users: usersApi,
  roles: rolesApi,
};
