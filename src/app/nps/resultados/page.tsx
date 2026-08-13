'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  api,
  type NpsCategory,
  type NpsScore,
  type NpsSortBy,
  type NpsSurvey,
  type Paginated,
  type SortDirection,
} from '@/lib/api';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { PlusIcon, StarIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

const PAGE_SIZES = [10, 25, 50] as const;

// ─── Helpers de presentación ──────────────────────────────────────────────────

function npsScoreColor(score: number) {
  if (score > 50) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 0) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function npsScoreBg(score: number) {
  if (score > 50) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (score >= 0) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-rose-50 dark:bg-rose-950/30';
}

function npsScoreLabel(score: number) {
  if (score > 70) return 'Excelente';
  if (score > 50) return 'Muy bueno';
  if (score > 0) return 'Positivo';
  if (score === 0) return 'Neutro';
  return 'Necesita mejora';
}

function surveyCategory(score: number): { label: string; cls: string } {
  if (score >= 9) return { label: 'Promotor', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' };
  if (score >= 7) return { label: 'Pasivo', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' };
  return { label: 'Detractor', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' };
}

function ScoreBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className="relative flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-sm tabular-nums font-medium text-slate-700 dark:text-slate-300">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Estado de filtros ────────────────────────────────────────────────────────

interface Filters {
  category: NpsCategory | '';
  scoreMin: string;
  scoreMax: string;
  dateFrom: string;
  dateTo: string;
  sortBy: NpsSortBy;
  sortDirection: SortDirection;
}

const EMPTY_FILTERS: Filters = {
  category: '',
  scoreMin: '',
  scoreMax: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NpsResultadosPage() {
  // Filtros — draft vs. aplicados
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);

  // Score
  const [scoreData, setScoreData] = useState<NpsScore | null>(null);
  const [scoreError, setScoreError] = useState(false);

  // Tabla
  const [surveys, setSurveys] = useState<Paginated<NpsSurvey> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  function applyFilters() {
    setApplied(draft);
    setPage(1);
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  }

  // Fetch score (se actualiza con filtros de fecha)
  useEffect(() => {
    const c = new AbortController();
    setScoreData(null);
    setScoreError(false);
    api.nps
      .score(
        {
          dateFrom: applied.dateFrom || undefined,
          dateTo: applied.dateTo || undefined,
        },
        c.signal,
      )
      .then(setScoreData)
      .catch(() => { if (!c.signal.aborted) setScoreError(true); });
    return () => c.abort();
  }, [applied.dateFrom, applied.dateTo]);

  // Fetch lista (se actualiza con todos los filtros)
  useEffect(() => {
    const c = new AbortController();
    setTableLoading(true);
    setTableError(null);
    api.nps
      .list(
        {
          category: applied.category || undefined,
          scoreMin: applied.scoreMin !== '' ? Number(applied.scoreMin) : undefined,
          scoreMax: applied.scoreMax !== '' ? Number(applied.scoreMax) : undefined,
          dateFrom: applied.dateFrom || undefined,
          dateTo: applied.dateTo || undefined,
          sortBy: applied.sortBy,
          sortDirection: applied.sortDirection,
          page,
          limit,
        },
        c.signal,
      )
      .then((res) => { if (!c.signal.aborted) setSurveys(res); })
      .catch(() => { if (!c.signal.aborted) setTableError('No se pudo cargar la lista de encuestas.'); })
      .finally(() => { if (!c.signal.aborted) setTableLoading(false); });
    return () => c.abort();
  }, [applied, page, limit]);

  const npsScore = scoreData?.score != null ? Math.round(parseFloat(scoreData.score)) : null;
  const promoters = scoreData ? parseFloat(scoreData.promotersPct) : 0;
  const passives = scoreData ? parseFloat(scoreData.passivesPct) : 0;
  const detractors = scoreData ? parseFloat(scoreData.detractorsPct) : 0;

  const hasActiveFilters =
    applied.category !== '' ||
    applied.scoreMin !== '' ||
    applied.scoreMax !== '' ||
    applied.dateFrom !== '' ||
    applied.dateTo !== '';

  return (
    <>
      <PageHeader
        title="NPS — Net Promoter Score"
        subtitle="Satisfaccion de clientes en ventas"
        actions={
          <Link href="/nps/nueva">
            <Button>
              <PlusIcon className="size-4" />
              Nueva encuesta
            </Button>
          </Link>
        }
      />

      {/* Score + distribución */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 mb-4">
            <StarIcon className="size-7" />
          </span>
          {scoreError ? (
            <p className="text-slate-400">Sin conexion</p>
          ) : scoreData === null ? (
            <div className="h-16 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          ) : npsScore === null ? (
            <>
              <p className="text-4xl font-bold text-slate-300 dark:text-slate-600">—</p>
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">Sin encuestas</p>
            </>
          ) : (
            <>
              <p className={cn('text-5xl font-bold tabular-nums', npsScoreColor(npsScore))}>
                {npsScore > 0 ? '+' : ''}{npsScore}
              </p>
              <span
                className={cn(
                  'mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold',
                  npsScoreBg(npsScore),
                  npsScoreColor(npsScore),
                )}
              >
                {npsScoreLabel(npsScore)}
              </span>
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                {applied.dateFrom || applied.dateTo ? 'Periodo filtrado' : 'Todos los periodos'} · −100 a +100
              </p>
            </>
          )}
        </Card>

        <Card className="col-span-1 p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Distribucion de respuestas
          </h2>
          {scoreData && npsScore !== null ? (
            <div className="space-y-4">
              <ScoreBar label="Promotores (9–10)" pct={promoters} color="bg-emerald-500" />
              <ScoreBar label="Pasivos (7–8)" pct={passives} color="bg-amber-400" />
              <ScoreBar label="Detractores (0–6)" pct={detractors} color="bg-rose-500" />
              <p className="pt-2 text-xs text-slate-400 dark:text-slate-500">
                Formula NPS: % promotores − % detractores
              </p>
            </div>
          ) : scoreData === null && !scoreError ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 h-3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {scoreError ? 'No se pudo cargar el score.' : 'Sin datos para este periodo.'}
            </p>
          )}
        </Card>
      </div>

      {/* Panel de filtros */}
      <Card className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Categoría */}
          <div>
            <label className={labelClass}>Categoria</label>
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as NpsCategory | '' }))}
              className={inputClass}
            >
              <option value="">Todas</option>
              <option value="promoter">Promotores (9–10)</option>
              <option value="passive">Pasivos (7–8)</option>
              <option value="detractor">Detractores (0–6)</option>
            </select>
          </div>

          {/* Score min/max */}
          <div>
            <label className={labelClass}>Score</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={10}
                placeholder="Mín"
                value={draft.scoreMin}
                onChange={(e) => setDraft((d) => ({ ...d, scoreMin: e.target.value }))}
                className={inputClass}
              />
              <span className="shrink-0 text-sm text-slate-400">–</span>
              <input
                type="number"
                min={0}
                max={10}
                placeholder="Máx"
                value={draft.scoreMax}
                onChange={(e) => setDraft((d) => ({ ...d, scoreMax: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Fecha desde/hasta */}
          <div>
            <label className={labelClass}>Fecha desde</label>
            <input
              type="date"
              value={draft.dateFrom}
              onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Fecha hasta</label>
            <input
              type="date"
              value={draft.dateTo}
              onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Ordenamiento */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Ordenar por</label>
            <select
              value={draft.sortBy}
              onChange={(e) => setDraft((d) => ({ ...d, sortBy: e.target.value as NpsSortBy }))}
              className={inputClass}
            >
              <option value="createdAt">Fecha</option>
              <option value="score">Score</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Direccion</label>
            <select
              value={draft.sortDirection}
              onChange={(e) => setDraft((d) => ({ ...d, sortDirection: e.target.value as SortDirection }))}
              className={inputClass}
            >
              <option value="DESC">Descendente</option>
              <option value="ASC">Ascendente</option>
            </select>
          </div>

          {/* Acciones de filtro */}
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button onClick={applyFilters} className="flex-1 sm:flex-none">
              Buscar
            </Button>
            {hasActiveFilters && (
              <Button variant="secondary" onClick={resetFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabla de encuestas */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Encuestas
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-normal text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                filtrado
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Filas:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value) as typeof limit); setPage(1); }}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left">Fecha</th>
                <th className="px-5 py-3 text-left">Score</th>
                <th className="px-5 py-3 text-left">Categoria</th>
                <th className="px-5 py-3 text-left">Comentario</th>
                <th className="px-5 py-3 text-left">Venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tableError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-red-500 dark:text-red-400">
                    {tableError}
                  </td>
                </tr>
              ) : !surveys?.items.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    {hasActiveFilters
                      ? 'Ninguna encuesta coincide con los filtros aplicados.'
                      : 'No hay encuestas registradas.'}
                  </td>
                </tr>
              ) : (
                surveys.items.map((s) => {
                  const cat = surveyCategory(s.score);
                  return (
                    <tr key={s.surveyId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                        {new Date(s.createdAt).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100">
                          {s.score}
                        </span>
                        <span className="ml-1 text-xs text-slate-400">/10</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-semibold', cat.cls)}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="max-w-xs px-5 py-3">
                        {s.comment ? (
                          <span className="block max-w-xs truncate text-slate-500 dark:text-slate-400" title={s.comment}>
                            {s.comment}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-400 dark:text-slate-500">
                        {s.saleId.slice(0, 8)}…
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {surveys && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pagina {surveys.meta.page} de {surveys.meta.totalPages} · {surveys.meta.total} encuestas
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p - 1)}
                disabled={!surveys.meta.hasPreviousPage}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={!surveys.meta.hasNextPage}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
