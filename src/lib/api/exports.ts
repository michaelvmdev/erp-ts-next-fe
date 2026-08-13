import { http } from './http';

export const exportsApi = {
  sales: (params?: { dateFrom?: string; dateTo?: string }) =>
    http.download('/exports/sales', 'ventas.csv', params as Record<string, string>),

  purchases: (params?: { dateFrom?: string; dateTo?: string }) =>
    http.download('/exports/purchases', 'compras.csv', params as Record<string, string>),

  products: () =>
    http.download('/exports/products', 'productos.csv'),

  clients: () =>
    http.download('/exports/clients', 'clientes.csv'),
};
