import { http, type Query } from './http';
import type {
  MonthlySalesByUbigeoParams,
  MonthlySalesSeries,
  TopProductByMonthSeries,
  YearlySalesResponse,
} from './types';

/** Diagramas anuales del tablero: /dashboard/* */
export const dashboardApi = {
  /** GET /dashboard/monthly-sales?year */
  monthlySales: (year: number, signal?: AbortSignal) =>
    http.get<MonthlySalesSeries>('/dashboard/monthly-sales', { year }, signal),

  /** GET /dashboard/monthly-sales-by-ubigeo?year&departmentId&provinceId?&districtId? */
  monthlySalesByUbigeo: (
    params: MonthlySalesByUbigeoParams,
    signal?: AbortSignal,
  ) =>
    http.get<MonthlySalesSeries>(
      '/dashboard/monthly-sales-by-ubigeo',
      params as unknown as Query,
      signal,
    ),

  /** GET /dashboard/monthly-sales-by-category?year&categoryId */
  monthlySalesByCategory: (
    year: number,
    categoryId: string,
    signal?: AbortSignal,
  ) =>
    http.get<MonthlySalesSeries>(
      '/dashboard/monthly-sales-by-category',
      { year, categoryId },
      signal,
    ),

  /** GET /dashboard/top-product-by-month?year */
  topProductByMonth: (year: number, signal?: AbortSignal) =>
    http.get<TopProductByMonthSeries>(
      '/dashboard/top-product-by-month',
      { year },
      signal,
    ),

  /** GET /dashboard/yearly-sales */
  yearlySales: (signal?: AbortSignal) =>
    http.get<YearlySalesResponse>('/dashboard/yearly-sales', undefined, signal),

  /** GET /dashboard/monthly-purchases?year */
  monthlyPurchases: (year: number, signal?: AbortSignal) =>
    http.get<MonthlySalesSeries>('/dashboard/monthly-purchases', { year }, signal),

  /** GET /dashboard/monthly-purchases-by-category?year&categoryId */
  monthlyPurchasesByCategory: (
    year: number,
    categoryId: string,
    signal?: AbortSignal,
  ) =>
    http.get<MonthlySalesSeries>(
      '/dashboard/monthly-purchases-by-category',
      { year, categoryId },
      signal,
    ),

  /** GET /dashboard/top-purchased-product-by-month?year */
  topPurchasedProductByMonth: (year: number, signal?: AbortSignal) =>
    http.get<TopProductByMonthSeries>(
      '/dashboard/top-purchased-product-by-month',
      { year },
      signal,
    ),

  /** GET /dashboard/yearly-purchases */
  yearlyPurchases: (signal?: AbortSignal) =>
    http.get<YearlySalesResponse>('/dashboard/yearly-purchases', undefined, signal),
};
