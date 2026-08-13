'use client';

import { useEffect, useState } from 'react';
import { Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { api, type MonthComparison } from '@/lib/api';
import { cn } from '@/lib/cn';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function fmt(val: string | null | undefined) {
  if (!val) return 'S/ 0.00';
  return `S/ ${parseFloat(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PctBadge({ pct }: { pct: string | null }) {
  if (pct === null)
    return <span className="text-zinc-400 text-xs">sin datos</span>;
  const v = parseFloat(pct);
  const isUp = v >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-sm font-semibold',
        isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      )}
    >
      {isUp ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%
    </span>
  );
}

function StatCard({
  title,
  amount,
  count,
  pct,
  subtitle,
}: {
  title: string;
  amount: string;
  count: number;
  pct?: string | null;
  subtitle?: string;
}) {
  return (
    <Card className="p-5 space-y-1">
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{fmt(amount)}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{count.toLocaleString('es-PE')} ventas</p>
      {pct !== undefined && (
        <div className="flex items-center gap-2 pt-1">
          <PctBadge pct={pct} />
          {subtitle && <span className="text-xs text-zinc-400">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}

export default function ComparativaPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,    setData]    = useState<MonthComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api.dashboard
      .comparison(year, month, ctrl.signal)
      .then(setData)
      .catch((e: Error) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [year, month]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <PageHeader title="Comparativa MoM / YoY" />

      {/* Selectores */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Año</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={inputClass}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Mes</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={inputClass}
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Resultado */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      )}

      {error && (
        <Card className="p-4">
          <p className="text-sm text-red-500">{error}</p>
        </Card>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title={`${MONTHS[data.month - 1]} ${data.year}`}
              amount={data.currentAmount}
              count={data.currentCount}
            />
            <StatCard
              title="vs Mes anterior"
              amount={data.prevAmount}
              count={data.prevCount}
              pct={data.momPct}
              subtitle="MoM"
            />
            <StatCard
              title="vs Mismo mes año pasado"
              amount={data.prevYearAmount}
              count={data.prevYearCount}
              pct={data.yoyPct}
              subtitle="YoY"
            />
          </div>

          {/* Tabla detalle */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
              Detalle comparativo
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
                    <th className="py-2 pr-4 text-left">Periodo</th>
                    <th className="py-2 pr-4 text-right">Importe</th>
                    <th className="py-2 pr-4 text-right">Ventas</th>
                    <th className="py-2 text-right">Variación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 font-medium">
                    <td className="py-2 pr-4">{MONTHS[data.month - 1]} {data.year}</td>
                    <td className="py-2 pr-4 text-right">{fmt(data.currentAmount)}</td>
                    <td className="py-2 pr-4 text-right">{data.currentCount.toLocaleString('es-PE')}</td>
                    <td className="py-2 text-right text-zinc-400 text-xs">base</td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 pr-4 text-zinc-500">
                      {MONTHS[data.month === 1 ? 11 : data.month - 2]} {data.month === 1 ? data.year - 1 : data.year}
                    </td>
                    <td className="py-2 pr-4 text-right text-zinc-500">{fmt(data.prevAmount)}</td>
                    <td className="py-2 pr-4 text-right text-zinc-500">{data.prevCount.toLocaleString('es-PE')}</td>
                    <td className="py-2 text-right"><PctBadge pct={data.momPct} /></td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-zinc-500">
                      {MONTHS[data.month - 1]} {data.year - 1}
                    </td>
                    <td className="py-2 pr-4 text-right text-zinc-500">{fmt(data.prevYearAmount)}</td>
                    <td className="py-2 pr-4 text-right text-zinc-500">{data.prevYearCount.toLocaleString('es-PE')}</td>
                    <td className="py-2 text-right"><PctBadge pct={data.yoyPct} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
