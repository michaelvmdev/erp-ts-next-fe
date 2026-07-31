import { http } from './http';
import type { Department, District, Province } from './types';

/** Ubigeo (selectores en cascada): /ubigeo */
export const ubigeoApi = {
  /** GET /ubigeo/departments */
  departments: (signal?: AbortSignal) =>
    http.get<Department[]>('/ubigeo/departments', undefined, signal),

  /** GET /ubigeo/departments/:departmentId/provinces */
  provinces: (departmentId: string, signal?: AbortSignal) =>
    http.get<Province[]>(
      `/ubigeo/departments/${departmentId}/provinces`,
      undefined,
      signal,
    ),

  /** GET /ubigeo/provinces/:provinceId/districts */
  districts: (provinceId: string, signal?: AbortSignal) =>
    http.get<District[]>(
      `/ubigeo/provinces/${provinceId}/districts`,
      undefined,
      signal,
    ),
};
