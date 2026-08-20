import { http, type Query } from './http';

export interface ValidateDocResult {
  numero: string;
  valid: boolean;
  reason?: string;
  source: 'local';
}

export const sunatApi = {
  validateRuc: (numero: string, signal?: AbortSignal) =>
    http.get<ValidateDocResult>('/sunat/validate/ruc', { numero } as Query, signal),

  validateDni: (numero: string, signal?: AbortSignal) =>
    http.get<ValidateDocResult>('/sunat/validate/dni', { numero } as Query, signal),

  /** Returns a URL to download the XML for a given sale ID (authenticated). */
  invoiceXmlUrl: (saleId: string) => `/sunat/facturas/${saleId}/xml`,
};
