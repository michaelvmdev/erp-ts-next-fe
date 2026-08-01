const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

/** Formatea un monto en soles: 1059.6 -> "S/ 1,059.60". */
export function formatCurrency(value: number): string {
  return currency.format(value);
}

/** Nombre del mes actual en espanol: "julio de 2026". */
export function currentMonthLabel(date = new Date()): string {
  return new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}
