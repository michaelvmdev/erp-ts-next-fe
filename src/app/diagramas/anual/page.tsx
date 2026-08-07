'use client';

import { useEffect, useMemo, useState } from 'react';
import type Highcharts from 'highcharts';
import { LineChart } from '@/components/line-chart';
import { Card, PageHeader } from '@/components/ui';
import { RefreshIcon } from '@/components/icons';
import { useIsDark } from '@/lib/use-theme';
import { formatCurrency } from '@/lib/format';
import { api, type YearlySalesPoint } from '@/lib/api';

function themeColors(isDark: boolean) {
  return {
    text: isDark ? '#cbd5e1' : '#475569',
    grid: isDark ? '#1e293b' : '#e2e8f0',
    axis: isDark ? '#334155' : '#cbd5e1',
  };
}

function buildOptions(
  isDark: boolean,
  points: YearlySalesPoint[],
): Highcharts.Options {
  const c = themeColors(isDark);
  const color = '#6366f1';
  const years = points.map((p) => String(p.year));
  const totals = points.map((p) => Number(p.total));

  return {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      spacing: [10, 10, 10, 0],
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories: years,
      lineColor: c.axis,
      tickColor: c.axis,
      labels: { style: { color: c.text } },
    },
    yAxis: {
      title: { text: undefined },
      gridLineColor: c.grid,
      min: 0,
      labels: {
        style: { color: c.text },
        formatter(this: Highcharts.AxisLabelsFormatterContextObject) {
          return formatCurrency(Number(this.value));
        },
      },
    },
    tooltip: {
      formatter(this: Highcharts.Point) {
        return `<b>${this.category}</b><br/>${formatCurrency(Number(this.y))}`;
      },
    },
    plotOptions: {
      column: {
        color,
        borderRadius: 4,
        dataLabels: {
          enabled: true,
          formatter(this: Highcharts.Point) {
            const y = Number(this.y);
            return y > 0
              ? formatCurrency(y)
              : '';
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
    series: [{ type: 'column', name: 'Total', data: totals, color }],
  };
}

function ChartFrame({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
        Total de ventas por año
      </h2>
      {error ? (
        <div className="flex h-80 items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : loading ? (
        <div className="flex h-80 w-full flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
          <span
            className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400"
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

export default function DiagramasAnualPage() {
  const isDark = useIsDark();
  const [data, setData] = useState<YearlySalesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.dashboard
      .yearlySales(c.signal)
      .then((res) => {
        if (!c.signal.aborted) setData(res.items);
      })
      .catch(() => {
        if (!c.signal.aborted) setError('No se pudo cargar el diagrama.');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [refresh]);

  const options = useMemo(() => buildOptions(isDark, data), [isDark, data]);

  return (
    <>
      <PageHeader
        title="Diagramas anuales"
        subtitle="Evolución del total de ventas año a año."
        actions={
          <button
            type="button"
            onClick={() => setRefresh((r) => r + 1)}
            disabled={loading}
            aria-label="Recargar"
            title="Recargar"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshIcon className="size-4" />
          </button>
        }
      />
      <ChartFrame loading={loading} error={error}>
        <LineChart options={options} />
      </ChartFrame>
    </>
  );
}
