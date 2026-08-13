'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ApiError, type NpsSurvey, type SaleSummary } from '@/lib/api';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { CheckIcon, SearchIcon } from '@/components/icons';
import { PickerModal } from '@/components/picker-modal';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

function ScorePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>Detractor</span>
        <span>Pasivo</span>
        <span>Promotor</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 11 }, (_, i) => {
          const isSelected = value === i;
          const isPromoter = i >= 9;
          const isPassive = i >= 7;

          const unselectedCls = isPromoter
            ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
            : isPassive
              ? 'border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30'
              : 'border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30';

          const selectedCls = isPromoter
            ? 'bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600'
            : isPassive
              ? 'bg-amber-400 text-white border-amber-400 dark:bg-amber-500 dark:border-amber-500'
              : 'bg-rose-500 text-white border-rose-500 dark:bg-rose-600 dark:border-rose-600';

          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                'flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                isSelected ? selectedCls : unselectedCls,
              )}
            >
              {i}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        0–6 Detractor · 7–8 Pasivo · 9–10 Promotor
      </p>
    </div>
  );
}

export default function NpsNuevaPage() {
  const [sale, setSale] = useState<SaleSummary | null>(null);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NpsSurvey | null>(null);

  const canSubmit = sale !== null && score !== null && !submitting;

  async function submit() {
    if (!canSubmit || score === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.nps.create({
        saleId: sale!.saleId,
        score,
        comment: comment.trim() || undefined,
      });
      setResult(created);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.code ?? err.status}: ${err.message}`
          : (err as Error).message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSale(null);
    setScore(null);
    setComment('');
    setError(null);
    setResult(null);
  }

  // Pantalla de exito
  if (result) {
    const cat =
      result.score >= 9 ? 'Promotor' : result.score >= 7 ? 'Pasivo' : 'Detractor';
    return (
      <>
        <PageHeader title="Nueva encuesta NPS" />
        <div className="mx-auto max-w-lg">
          <Card className="p-8 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckIcon className="size-7" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Encuesta registrada
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Score{' '}
              <strong className="text-slate-700 dark:text-slate-200">{result.score}/10</strong>{' '}
              · {cat}
            </p>
            {result.comment && (
              <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm italic text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                &ldquo;{result.comment}&rdquo;
              </p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="secondary" onClick={reset}>
                Nueva encuesta
              </Button>
              <Link href="/nps/resultados">
                <Button>Ver resultados</Button>
              </Link>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Nueva encuesta NPS"
        subtitle="Registra la satisfaccion del cliente despues de una venta"
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Venta */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Venta
          </h2>
          {sale ? (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{sale.saleNumber}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {sale.saleDate} · {formatCurrency(sale.total)}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setSaleModalOpen(true)}>
                Cambiar
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setSaleModalOpen(true)} className="w-full">
              <SearchIcon className="size-4" />
              Buscar venta
            </Button>
          )}
        </Card>

        {/* Score */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Puntaje de satisfaccion
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            &iquest;Con que probabilidad recomendaria nuestros productos? (0 = nunca, 10 = definitivamente)
          </p>
          <ScorePicker value={score} onChange={setScore} />
        </Card>

        {/* Comentario */}
        <Card className="p-6">
          <label htmlFor="comment" className={labelClass}>
            Comentario <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos más sobre tu experiencia..."
            rows={3}
            className={cn(inputClass, 'resize-none')}
          />
        </Card>

        {/* Acciones */}
        <div className="flex justify-end gap-3">
          <Link href="/nps/resultados">
            <Button variant="secondary">Cancelar</Button>
          </Link>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting ? 'Guardando…' : 'Guardar encuesta'}
          </Button>
        </div>
      </div>

      {/* Modal de búsqueda de venta */}
      <PickerModal<SaleSummary>
        open={saleModalOpen}
        title="Buscar venta"
        searchPlaceholder="Numero de comprobante…"
        headers={['Comprobante', 'Fecha', 'Total']}
        getKey={(s) => s.saleId}
        renderCells={(s) => [s.saleNumber, s.saleDate, formatCurrency(s.total)]}
        fetchPage={(q, page, signal) =>
          api.sales.list({ saleNumber: q || undefined, page, limit: 5 }, signal)
        }
        onSelect={(s) => { setSale(s); setSaleModalOpen(false); }}
        onClose={() => setSaleModalOpen(false)}
      />
    </>
  );
}
