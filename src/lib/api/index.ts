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
import { npsApi } from './nps';
import { usersEcommerceApi } from './users-ecommerce';
import { exportsApi } from './exports';
import { searchApi } from './search';
import { auditApi } from './audit';
import { purchaseReturnsApi } from './purchase-returns';
import { quotesApi } from './quotes';
import { lotsApi } from './lots';
import { journalApi, reportsApi } from './journal';
import { sunatApi } from './sunat';

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
  npsApi,
  usersEcommerceApi,
  exportsApi,
  searchApi,
  auditApi,
  purchaseReturnsApi,
  quotesApi,
  lotsApi,
  journalApi,
  reportsApi,
  sunatApi,
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
  nps: npsApi,
  usersEcommerce: usersEcommerceApi,
  exports: exportsApi,
  search: searchApi,
  audit: auditApi,
  purchaseReturns: purchaseReturnsApi,
  quotes: quotesApi,
  lots: lotsApi,
  journal: journalApi,
  reports: reportsApi,
  sunat: sunatApi,
};
