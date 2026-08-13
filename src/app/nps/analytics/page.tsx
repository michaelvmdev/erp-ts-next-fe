'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type Highcharts from 'highcharts';
import { LineChart } from '@/components/line-chart';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { useIsDark } from '@/lib/use-theme';
import {
  api,
  type NpsAnalytics,
  type NpsCampaignContact,
  type NpsCampaignResult,
  type NpsCategoryAnalytics,
  type NpsProductAnalytics,
} from '@/lib/api';
import { CloseIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return '#94a3b8';
  if (score > 50) return '#10b981';
  if (score >= 0) return '#f59e0b';
  return '#f43f5e';
}

function scoreBadge(score: number | null) {
  if (score === null)
    return <span className="text-zinc-400 text-sm">Sin datos</span>;
  const cls =
    score > 50
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
      : score >= 0
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400';
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-semibold', cls)}>
      {score > 0 ? `+${score}` : score}
    </span>
  );
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
  scores: Array<number | null>,
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
    legend: { enabled: false },
    xAxis: {
      categories: labels,
      lineColor: c.axis,
      tickColor: c.axis,
      labels: {
        style: { color: c.text, fontSize: '11px' },
        rotation: labels.length > 6 ? -35 : 0,
      },
    },
    yAxis: {
      title: { text: 'NPS', style: { color: c.text } },
      gridLineColor: c.grid,
      labels: { style: { color: c.text } },
      min: -100,
      max: 100,
      plotLines: [{ value: 0, color: c.axis, width: 1, zIndex: 3 }],
    },
    tooltip: {
      formatter(this: Highcharts.Point) {
        const v = Number(this.y);
        return `<b>${this.name}</b><br/>NPS: <b>${v > 0 ? '+' : ''}${v}</b>`;
      },
    },
    series: [
      {
        type: 'column',
        name: 'NPS',
        data: scores.map((s, i) => ({
          y: s ?? 0,
          color: scoreColor(s),
          name: labels[i],
        })),
        borderRadius: 3,
      },
    ],
  };
}

// ─── Tabla de categorías ──────────────────────────────────────────────────────

function CategoryTable({ rows }: { rows: NpsCategoryAnalytics[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">Sin datos para el periodo.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2 text-left">Categoría</th>
            <th className="px-4 py-2 text-right">Encuestas</th>
            <th className="px-4 py-2 text-right">Promotores</th>
            <th className="px-4 py-2 text-right">Pasivos</th>
            <th className="px-4 py-2 text-right">Detractores</th>
            <th className="px-4 py-2 text-right">NPS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r) => (
            <tr key={r.categoryId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                {r.categoryName}
              </td>
              <td className="px-4 py-2 text-right text-zinc-600 dark:text-zinc-400">
                {r.totalSurveys}
              </td>
              <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">
                {r.promoters}
              </td>
              <td className="px-4 py-2 text-right text-amber-600 dark:text-amber-400">
                {r.passives}
              </td>
              <td className="px-4 py-2 text-right text-rose-600 dark:text-rose-400">
                {r.detractors}
              </td>
              <td className="px-4 py-2 text-right">{scoreBadge(r.npsScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tabla de productos ───────────────────────────────────────────────────────

function ProductTable({ rows }: { rows: NpsProductAnalytics[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">Sin datos para el periodo.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2 text-left">Producto</th>
            <th className="px-4 py-2 text-left">Categoría</th>
            <th className="px-4 py-2 text-right">Encuestas</th>
            <th className="px-4 py-2 text-right">Promotores</th>
            <th className="px-4 py-2 text-right">Pasivos</th>
            <th className="px-4 py-2 text-right">Detractores</th>
            <th className="px-4 py-2 text-right">NPS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r) => (
            <tr key={r.productId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200 max-w-[200px] truncate">
                {r.productName}
              </td>
              <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">{r.categoryName}</td>
              <td className="px-4 py-2 text-right text-zinc-600 dark:text-zinc-400">
                {r.totalSurveys}
              </td>
              <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">
                {r.promoters}
              </td>
              <td className="px-4 py-2 text-right text-amber-600 dark:text-amber-400">
                {r.passives}
              </td>
              <td className="px-4 py-2 text-right text-rose-600 dark:text-rose-400">
                {r.detractors}
              </td>
              <td className="px-4 py-2 text-right">{scoreBadge(r.npsScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-72 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-40 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

// ─── Modal de campaña ─────────────────────────────────────────────────────────

const SEGMENT_LABEL: Record<'promoter' | 'passive' | 'detractor', string> = {
  promoter: 'Promotores (score 9–10)',
  passive: 'Pasivos (score 7–8)',
  detractor: 'Detractores (score 0–6)',
};

function CampaignModal({ onClose }: { onClose: () => void }) {
  const [segment, setSegment] = useState<'promoter' | 'passive' | 'detractor'>('promoter');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<NpsCampaignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await api.nps.campaign({ segment, subject: subject.trim() });
      setResult(res);
    } catch {
      setError('No se pudo procesar la campaña.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Campaña de email por segmento NPS
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="p-5">
          {!result ? (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className={labelClass}>Segmento</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as typeof segment)}
                  className={inputClass}
                >
                  <option value="promoter">{SEGMENT_LABEL.promoter}</option>
                  <option value="passive">{SEGMENT_LABEL.passive}</option>
                  <option value="detractor">{SEGMENT_LABEL.detractor}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Asunto del email</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={150}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                  placeholder="Gracias por recomendarnos — descuento exclusivo"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} disabled={sending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={sending}>
                  {sending ? 'Enviando…' : 'Enviar campaña'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Campaña enviada a {result.sentTo} usuario{result.sentTo !== 1 ? 's' : ''}
                </p>
                <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-500">
                  Segmento: {SEGMENT_LABEL[result.segment]} · Asunto: {result.subject}
                </p>
              </div>
              {result.contacts.length > 0 && (
                <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Nombre</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {result.contacts.map((c: NpsCampaignContact) => (
                        <tr key={c.email}>
                          <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">
                            {c.firstName} {c.lastName}
                          </td>
                          <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">{c.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={onClose}>Cerrar</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NpsAnalyticsPage() {
  const isDark = useIsDark();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [showCampaign, setShowCampaign] = useState(false);

  const [data, setData] = useState<NpsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);

    api.nps
      .analytics(
        {
          dateFrom: appliedFrom || undefined,
          dateTo: appliedTo || undefined,
        },
        c.signal,
      )
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return;
        setError('No se pudo cargar la analítica NPS.');
        setLoading(false);
      });

    return () => c.abort();
  }, [appliedFrom, appliedTo]);

  function handleSearch() {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }

  function handleClear() {
    setDateFrom('');
    setDateTo('');
    setAppliedFrom('');
    setAppliedTo('');
  }

  const categoryChartOptions = useMemo((): Highcharts.Options => {
    const rows = data?.byCategory ?? [];
    return buildChartOptions(
      rows.map((r) => r.categoryName),
      rows.map((r) => r.npsScore),
      isDark,
    );
  }, [data, isDark]);

  const productChartOptions = useMemo((): Highcharts.Options => {
    const rows = data?.byProduct ?? [];
    return buildChartOptions(
      rows.map((r) => r.productName),
      rows.map((r) => r.npsScore),
      isDark,
    );
  }, [data, isDark]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analítica NPS"
        subtitle="Net Promoter Score desglosado por categoría y producto."
        actions={
          <Button onClick={() => setShowCampaign(true)}>
            Campaña de email
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Desde</label>
          <input
            type="date"
            className={inputClass}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Hasta</label>
          <input
            type="date"
            className={inputClass}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <button
          onClick={handleSearch}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Buscar
        </button>
        {(appliedFrom || appliedTo) && (
          <button
            onClick={handleClear}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Limpiar
          </button>
        )}
      </Card>

      {error && (
        <p className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </p>
      )}

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
          Excelente (NPS &gt; 50)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-500" />
          Positivo (NPS 0–50)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-rose-500" />
          Negativo (NPS &lt; 0)
        </span>
      </div>

      {/* Por categoría */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          NPS por categoría
        </h2>
        {loading ? (
          <Skeleton />
        ) : (
          <>
            <Card>
              <LineChart options={categoryChartOptions} />
            </Card>
            <CategoryTable rows={data?.byCategory ?? []} />
          </>
        )}
      </div>

      {showCampaign && <CampaignModal onClose={() => setShowCampaign(false)} />}

      {/* Por producto */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          NPS por producto
          <span className="ml-2 text-xs font-normal text-zinc-400">top 20</span>
        </h2>
        {loading ? (
          <Skeleton />
        ) : (
          <>
            <Card>
              <LineChart options={productChartOptions} />
            </Card>
            <ProductTable rows={data?.byProduct ?? []} />
          </>
        )}
      </div>
    </div>
  );
}
