'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type NpsScore } from '@/lib/api';
import { Card } from './ui';
import { StarIcon } from './icons';
import { cn } from '@/lib/cn';

function scoreColor(score: number) {
  if (score > 50) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 0) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function NpsIndicator() {
  const [data, setData] = useState<NpsScore | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    api.nps.score({}, c.signal)
      .then(setData)
      .catch(() => { if (!c.signal.aborted) setError(true); });
    return () => c.abort();
  }, []);

  const score = data?.score != null ? Math.round(parseFloat(data.score)) : null;
  const promoters = data ? parseFloat(data.promotersPct) : 0;
  const passives = data ? parseFloat(data.passivesPct) : 0;
  const detractors = data ? parseFloat(data.detractorsPct) : 0;

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Net Promoter Score
      </h2>
      <Link href="/nps/resultados" className="group block">
        <Card className="p-5 transition group-hover:border-blue-300 group-hover:shadow-md dark:group-hover:border-blue-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Score */}
            <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
              <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <StarIcon className="size-6" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Score NPS</p>
                {error ? (
                  <p className="text-2xl font-bold text-slate-400">—</p>
                ) : data === null ? (
                  <div className="mt-1 h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                ) : score === null ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">Sin datos</p>
                ) : (
                  <p className={cn('text-2xl font-bold tabular-nums', scoreColor(score))}>
                    {score > 0 ? '+' : ''}{score}
                  </p>
                )}
              </div>
            </div>

            {/* Barras */}
            {data && score !== null && (
              <div className="flex flex-1 flex-col gap-2">
                <BarRow label="Promotores" pct={promoters} color="bg-emerald-500" />
                <BarRow label="Pasivos" pct={passives} color="bg-amber-400" />
                <BarRow label="Detractores" pct={detractors} color="bg-rose-500" />
              </div>
            )}
          </div>
        </Card>
      </Link>
    </div>
  );
}

function BarRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <div className="relative flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}
