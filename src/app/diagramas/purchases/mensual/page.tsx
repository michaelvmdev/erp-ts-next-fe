'use client';

import { useEffect, useMemo, useState } from 'react';
import type Highcharts from 'highcharts';
import { LineChart } from '@/components/line-chart';
import { Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { useIsDark } from '@/lib/use-theme';
import { formatCurrency } from '@/lib/format';
import { RefreshIcon } from '@/components/icons';
import {
  api,
  type Category,
  type MonthlySalesSeries,
  type TopProductByMonthSeries,
} from '@/lib/api';

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const compact = new Intl.NumberFormat('es-PE', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function themeColors(isDark: boolean) {
  return {
    text: isDark ? '#cbd5e1' : '#475569',
    grid: isDark ? '#1e293b' : '#e2e8f0',
    axis: isDark ? '#334155' : '#cbd5e1',
  };
}

const baseChart = (isDark: boolean): Highcharts.Options => {
  const c = themeColors(isDark);
  return {
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      spacing: [10, 10, 10, 0],
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories: MONTHS,
      lineColor: c.axis,
      tickColor: c.axis,
      labels: { style: { color: c.text } },
    },
    yAxis: {
      title: { text: undefined },
      gridLineColor: c.grid,
      min: 0,
      labels: { style: { color: c.text } },
    },
  };
};

function moneyOptions(
  isDark: boolean,
  color: string,
  totals: number[],
): Highcharts.Options {
  const c = themeColors(isDark);
  return {
    ...baseChart(isDark),
    tooltip: {
      formatter(this: Highcharts.Point) {
        return `<b>${MONTHS[Number(this.x)] ?? ''}</b><br/>${formatCurrency(Number(this.y))}`;
      },
    },
    plotOptions: {
      line: {
        color,
        marker: { enabled: true, radius: 3 },
        dataLabels: {
          enabled: true,
          formatter(this: Highcharts.Point) {
            const y = Number(this.y);
            return y > 0 ? `S/ ${compact.format(y)}` : '';
          },
          style: {
            color: c.text,
            textOutline: 'none',
            fontWeight: '600',
            fontSize: '11px',
          },
        },
      },
    },
    series: [{ type: 'line', name: 'Total', data: totals, color }],
  };
}

function topProductOptions(
  isDark: boolean,
  points: { y: number; name: string | null }[],
): Highcharts.Options {
  const c = themeColors(isDark);
  const color = '#f59e0b';
  return {
    ...baseChart(isDark),
    yAxis: {
      title: { text: 'Unidades', style: { color: c.text } },
      gridLineColor: c.grid,
      min: 0,
      labels: { style: { color: c.text } },
    },
    tooltip: {
      formatter(this: Highcharts.Point) {
        const name = this.name || 'Sin compras';
        return `<b>${MONTHS[Number(this.x)] ?? ''}</b><br/>${name}<br/>${this.y} unidades`;
      },
    },
    plotOptions: {
      line: {
        color,
        marker: { enabled: true, radius: 3 },
        dataLabels: {
          enabled: true,
          formatter(this: Highcharts.Point) {
            const name = this.name;
            if (!name) return '';
            return name.length > 16 ? `${name.slice(0, 15)}…` : name;
          },
          style: {
            color: c.text,
            textOutline: 'none',
            fontWeight: '600',
            fontSize: '10px',
          },
        },
      },
    },
    series: [
      {
        type: 'line',
        name: 'Producto lider',
        data: points.map((p) => ({ y: p.y, name: p.name ?? undefined })),
        color,
      },
    ],
  };
}

function toTotals(series: MonthlySalesSeries | null): number[] {
  const byMonth = new Map(series?.items.map((i) => [i.month, Number(i.total)]));
  return MONTHS.map((_, idx) => byMonth.get(idx + 1) ?? 0);
}

function ChartFrame({
  title,
  controls,
  loading,
  error,
  children,
}: {
  title: string;
  controls?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        {controls}
      </div>
      {error ? (
        <div className="flex h-80 items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : loading ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
          <span
            className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400"
            role="status"
            aria-label="Cargando"
          />
          <span className="text-sm">Cargando…</span>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}

// --- 1) Compras mensuales ----------------------------------------------------

function MonthlyPurchasesChart({ year, isDark, refresh }: { year: number; isDark: boolean; refresh: number }) {
  const [data, setData] = useState<MonthlySalesSeries | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.dashboard
      .monthlyPurchases(year, c.signal)
      .then((res) => {
        if (!c.signal.aborted) setData(res);
      })
      .catch(() => {
        if (!c.signal.aborted) setError('No se pudo cargar el diagrama.');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [year, refresh]);

  const options = useMemo(
    () => moneyOptions(isDark, '#6366f1', toTotals(data)),
    [isDark, data],
  );

  return (
    <ChartFrame
      title={`Compras mensuales del ${year}`}
      loading={loading}
      error={error}
    >
      <LineChart options={options} />
    </ChartFrame>
  );
}

// --- 2) Compras por categoria -------------------------------------------------

function PurchasesByCategoryChart({
  year,
  isDark,
  refresh,
}: {
  year: number;
  isDark: boolean;
  refresh: number;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [data, setData] = useState<MonthlySalesSeries | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    api.categories
      .list({ categoryActive: true, limit: 100, sortDirection: 'ASC' }, c.signal)
      .then((page) => {
        if (c.signal.aborted) return;
        setCategories(page.items);
        setCategoryId((prev) => prev || page.items[0]?.categoryId || '');
      })
      .catch(() => {});
    return () => c.abort();
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.dashboard
      .monthlyPurchasesByCategory(year, categoryId, c.signal)
      .then((res) => {
        if (!c.signal.aborted) setData(res);
      })
      .catch(() => {
        if (!c.signal.aborted) setError('No se pudo cargar el diagrama.');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [year, categoryId, refresh]);

  const options = useMemo(
    () => moneyOptions(isDark, '#8b5cf6', toTotals(data)),
    [isDark, data],
  );

  return (
    <ChartFrame
      title={`Compras por categoria del ${year}`}
      error={error}
      loading={loading || categories.length === 0}
      controls={
        <select
          aria-label="Categoria"
          className={`${inputClass} !w-auto min-w-40`}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.categoryDescription}
            </option>
          ))}
        </select>
      }
    >
      <LineChart options={options} />
    </ChartFrame>
  );
}

// --- 3) Producto mas comprado por mes ----------------------------------------

function TopPurchasedProductChart({ year, isDark, refresh }: { year: number; isDark: boolean; refresh: number }) {
  const [data, setData] = useState<TopProductByMonthSeries | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.dashboard
      .topPurchasedProductByMonth(year, c.signal)
      .then((res) => {
        if (!c.signal.aborted) setData(res);
      })
      .catch(() => {
        if (!c.signal.aborted) setError('No se pudo cargar el diagrama.');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [year, refresh]);

  const options = useMemo(() => {
    const byMonth = new Map(data?.items.map((i) => [i.month, i]));
    const points = MONTHS.map((_, idx) => {
      const it = byMonth.get(idx + 1);
      return { y: it?.unitsSold ?? 0, name: it?.productName ?? null };
    });
    return topProductOptions(isDark, points);
  }, [isDark, data]);

  return (
    <ChartFrame
      title={`Producto mas comprado por mes del ${year}`}
      loading={loading}
      error={error}
    >
      <LineChart options={options} />
    </ChartFrame>
  );
}

// --- Pagina ------------------------------------------------------------------

export default function DiagramasPurchasesMensualPage() {
  const isDark = useIsDark();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [refresh, setRefresh] = useState(0);

  return (
    <>
      <PageHeader
        title="Compras mensuales"
        subtitle="Desglose mensual de compras por año."
        actions={
          <div className="flex items-end gap-2">
            <div>
              <label className={labelClass} htmlFor="year">Año</label>
              <select
                id="year"
                className={`${inputClass} !w-auto`}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setRefresh((r) => r + 1)}
              aria-label="Recargar"
              title="Recargar"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshIcon className="size-4" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6">
        <MonthlyPurchasesChart year={year} isDark={isDark} refresh={refresh} />
        <PurchasesByCategoryChart year={year} isDark={isDark} refresh={refresh} />
        <TopPurchasedProductChart year={year} isDark={isDark} refresh={refresh} />
      </div>
    </>
  );
}
