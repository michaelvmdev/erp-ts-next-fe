import { salesApi } from './api';

export interface MonthlySummary {
  /** Cantidad de comprobantes del mes. */
  salesCount: number;
  /** Suma de los totales del mes (incluye IGV). */
  income: number;
  boletaCount: number;
  facturaCount: number;
}

/** Rango [primer dia, ultimo dia] del mes actual, en formato YYYY-MM-DD. */
export function currentMonthRange(now = new Date()): {
  dateFrom: string;
  dateTo: string;
} {
  const year = now.getFullYear();
  const month = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    dateFrom: `${year}-${pad(month + 1)}-01`,
    dateTo: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  };
}

// Tope de seguridad: 500 paginas de 100 = 50 000 ventas por mes.
const MAX_PAGES = 500;
const PAGE_SIZE = 100;

/**
 * Indicadores del mes actual.
 *
 * El backend no expone un endpoint de agregados, asi que se recorren las ventas
 * del mes (paginado) una sola vez y se calcula todo de esa pasada: el conteo
 * total sale del `meta.total`, y los importes y los conteos por tipo se acumulan
 * de las filas. Si el volumen mensual crece mucho, el paso natural es agregar un
 * endpoint de estadisticas en el backend (COUNT/SUM en SQL).
 */
export async function getMonthlySummary(
  signal?: AbortSignal,
): Promise<MonthlySummary> {
  const { dateFrom, dateTo } = currentMonthRange();

  let salesCount = 0;
  let income = 0;
  let boletaCount = 0;
  let facturaCount = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await salesApi.list(
      { dateFrom, dateTo, limit: PAGE_SIZE, page },
      signal,
    );

    if (page === 1) salesCount = result.meta.total;

    for (const sale of result.items) {
      income += sale.total;
      if (sale.saleTypeCode === 'BOL') boletaCount++;
      else if (sale.saleTypeCode === 'FAC') facturaCount++;
    }

    if (!result.meta.hasNextPage) break;
  }

  return { salesCount, income, boletaCount, facturaCount };
}
