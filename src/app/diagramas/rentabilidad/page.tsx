'use client';

import { useEffect, useMemo, useState } from 'react';
import type Highcharts from 'highcharts';
import { LineChart } from '@/components/line-chart';
import { Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { useIsDark } from '@/lib/use-theme';
import { api, type ProfitabilityRow } from '@/lib/api';
import { cn } from '@/lib/cn';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function marginColor(pct: string | null): string {
  if (pct === null) return '#94a3b8';
  const v = parseFloat(pct);
  if (v >= 40) return '#10b981';
  if (v >= 15) return '#f59e0b';
  return '#f43f5e';
}

function marginBadge(pct: string | null) {
  if (pct === null) return <span className="text-zinc-400 text-sm">—</span>;
  const v = parseFloat(pct);
  const cls =
    v >= 40
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
      : v >= 15
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400';
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-semibold', cls)}>
      {v.toFixed(1)}%
    </span>
  );
}

function fmt(val: string | null) {
  if (!val) return '—';
  return parseFloat(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function themeColors(isDark: boolean) {
  return {
    text: isDark ? '#cbd5e1' : '#475569',
    grid: isDark ? '#1e293b' : '#e2e8f0',
    axis: isDark ? '#334155' : '#cbd5e1',
  };
}

function buildChartOptions(
  labels: string[],
  revenues: number[],
  costs: Array<number | null>,
  isDark: boolean,
): Highcharts.Options {
  const c = themeColors(isDark);
  return {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      spacing: [16, 8, 16, 0],
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: {
      enabled: true,
      itemStyle: { color: c.text },
    },
    xAxis: {
      categories: labels,
      lineColor: c.axis,
      tickColor: c.axis,
      labels: {
        style: { color: c.text, fontSize: '11px' },
        rotation: labels.length > 8 ? -35 : 0,
      },
    },
    yAxis: {
      title: { text: 'Importe (S/)', style: { color: c.text } },
      gridLineColor: c.grid,
      labels: { style: { color: c.text } },
    },
    tooltip: {
      shared: true,
      formatter(this: Highcharts.Point) {
        const pts = (this as unknown as { points: Highcharts.Point[] }).points ?? [];
        return pts.length > 0
          ? pts.map((p) => `<span style="color:${p.color}">●</span> ${p.series.name}: <b>S/ ${Number(p.y).toFixed(2)}</b>`).join('<br/>')
          : `S/ ${Number(this.y).toFixed(2)}`;
      },
    },
    series: [
      {
        type: 'column',
        name: 'Ingresos',
        color: '#3b82f6',
        data: revenues,
        borderRadius: 3,
      },
      {
        type: 'column',
        name: 'Coste',
        color: '#f87171',
        data: costs.map((v) => v ?? 0),
        borderRadius: 3,
      },
    ],
  };
}

// ─── Tabla ────────────────────────────────────────────────────────────────────

function ProfitabilityTable({ rows }: { rows: ProfitabilityRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">Sin datos para el periodo.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
            <th className="py-2 pr-3 text-left">Producto</th>
            <th className="py-2 pr-3 text-left">Categoría</th>
            <th className="py-2 pr-3 text-right">Uds.</th>
            <th className="py-2 pr-3 text-right">Ingresos</th>
            <th className="py-2 pr-3 text-right">Coste prom.</th>
            <th className="py-2 pr-3 text-right">Coste total</th>
            <th className="py-2 text-right">Margen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.productId}
              className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
            >
              <td className="py-2 pr-3 font-medium">{r.productName}</td>
              <td className="py-2 pr-3 text-zinc-500">{r.categoryName}</td>
              <td className="py-2 pr-3 text-right">{r.unitsSold.toLocaleString('es-PE')}</td>
              <td className="py-2 pr-3 text-right">S/ {fmt(r.totalRevenue)}</td>
              <td className="py-2 pr-3 text-right text-zinc-500">{r.avgCost ? `S/ ${fmt(r.avgCost)}` : '—'}</td>
              <td className="py-2 pr-3 text-right text-zinc-500">{r.totalCost ? `S/ ${fmt(r.totalCost)}` : '—'}</td>
              <td className="py-2 text-right">{marginBadge(r.marginPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function RentabilidadPage() {
  const isDark = useIsDark();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [applied, setApplied] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const [rows,    setRows]    = useState<ProfitabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api.dashboard
      .profitability(
        { dateFrom: applied.from || undefined, dateTo: applied.to || undefined },
        ctrl.signal,
      )
      .then(setRows)
      .catch((e: Error) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [applied]);

  const top20 = useMemo(() => rows.slice(0, 20), [rows]);

  const chartOptions = useMemo(() => {
    const labels = top20.map((r) => r.productName);
    const revenues = top20.map((r) => parseFloat(r.totalRevenue));
    const costs    = top20.map((r) => (r.totalCost ? parseFloat(r.totalCost) : null));
    return buildChartOptions(labels, revenues, costs, isDark);
  }, [top20, isDark]);

  function apply() {
    setApplied({ from: dateFrom, to: dateTo });
  }

  function clear() {
    setDateFrom('');
    setDateTo('');
    setApplied({ from: '', to: '' });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Rentabilidad por producto" />

      {/* Filtros de fecha */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            onClick={apply}
            className="px-4 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Aplicar
          </button>
          {(applied.from || applied.to) && (
            <button
              onClick={clear}
              className="px-4 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Limpiar
            </button>
          )}
        </div>
      </Card>

      {/* Gráfico top 20 */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          Top 20 productos — Ingresos vs Coste
        </h2>
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <LineChart options={chartOptions} />
        )}
      </Card>

      {/* Tabla completa */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          Detalle completo ({rows.length} productos)
        </h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <ProfitabilityTable rows={rows} />
        )}
      </Card>
    </div>
  );
}
