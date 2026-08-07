'use client';

import { useEffect, useState } from 'react';
import { Card } from './ui';
import { CashIcon, DocumentTextIcon, ReceiptIcon } from './icons';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { getMonthlySummary, type MonthlySummary } from '@/lib/dashboard';

const number = new Intl.NumberFormat('es-PE');

interface CardDef {
  field: keyof MonthlySummary;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  iconWrap: string;
  format: (value: number) => string;
}

const cards: CardDef[] = [
  {
    field: 'salesCount',
    label: 'Ventas del mes',
    hint: 'Comprobantes emitidos',
    icon: ReceiptIcon,
    iconWrap:
      'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    format: (v) => number.format(v),
  },
  {
    field: 'income',
    label: 'Ingresos del mes',
    hint: 'Total facturado (incl. IGV)',
    icon: CashIcon,
    iconWrap:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    format: (v) => formatCurrency(v),
  },
  {
    field: 'boletaCount',
    label: 'Boletas',
    hint: 'Emitidas este mes',
    icon: DocumentTextIcon,
    iconWrap:
      'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    format: (v) => number.format(v),
  },
  {
    field: 'facturaCount',
    label: 'Facturas',
    hint: 'Emitidas este mes',
    icon: DocumentTextIcon,
    iconWrap:
      'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    format: (v) => number.format(v),
  },
];

/** Los 4 indicadores del mes actual, con datos reales del backend. */
export function MonthIndicators() {
  const [data, setData] = useState<MonthlySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMonthlySummary(controller.signal)
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted)
          setError('No se pudieron cargar los indicadores. ¿Esta activo el backend?');
      });
    return () => controller.abort();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = error
            ? '—'
            : data
              ? card.format(data[card.field])
              : null;
          return (
            <Card key={card.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg',
                    card.iconWrap,
                  )}
                >
                  <Icon className="size-5" />
                </span>
              </div>

              {value === null ? (
                <div className="mt-3 h-9 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              ) : (
                <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
                  {value}
                </p>
              )}

              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {card.hint}
              </p>
            </Card>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </>
  );
}
