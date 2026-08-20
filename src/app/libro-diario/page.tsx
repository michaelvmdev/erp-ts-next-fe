'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  api, ApiError,
  type CreateJournalEntryRequest, type JournalEntryDetail,
  type JournalEntrySummary, type JournalReferenceType, type Paginated,
} from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function fmtMoney(v: string | number) {
  return Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const REF_TYPE_LABELS: Record<JournalReferenceType, string> = {
  sale:             'Venta',
  purchase:         'Compra',
  purchase_return:  'Dev. compra',
  credit_note:      'Nota crédito',
  manual:           'Manual',
};

const REF_TYPE_COLORS: Record<JournalReferenceType, string> = {
  sale:             'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  purchase:         'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  purchase_return:  'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  credit_note:      'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  manual:           'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LibroDiarioPage() {
  const [data, setData]       = useState<Paginated<JournalEntrySummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo  ] = useState('');
  const [refType,  setRefType ] = useState<JournalReferenceType | ''>('');
  const [selected, setSelected] = useState<JournalEntryDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback((p = page) => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.journal
      .list({
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo   || undefined,
        referenceType: refType || undefined,
        page: p, limit: 20,
      }, c.signal)
      .then((res) => { setData(res); setLoading(false); })
      .catch(() => { setError('No se pudo cargar el libro diario.'); setLoading(false); });
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, dateFrom, dateTo, refType]);

  useEffect(() => {
    const c = load(page);
    return () => c.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, dateFrom, dateTo, refType]);

  function openDetail(id: string) {
    api.journal.get(id).then(setSelected).catch(() => null);
  }

  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Libro Diario"
        subtitle="Asientos contables en partida doble."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="size-4" />
            Nuevo asiento
          </Button>
        }
      />

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClass}>Desde</label>
          <input type="date" className={inputClass}
            value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label className={labelClass}>Hasta</label>
          <input type="date" className={inputClass}
            value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label className={labelClass}>Tipo</label>
          <select className={inputClass}
            value={refType}
            onChange={(e) => { setRefType(e.target.value as JournalReferenceType | ''); setPage(1); }}>
            <option value="">Todos</option>
            {(Object.keys(REF_TYPE_LABELS) as JournalReferenceType[]).map((t) => (
              <option key={t} value={t}>{REF_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">N° Asiento</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 text-right font-medium">Total Débito</th>
                <th className="px-4 py-3 text-right font-medium">Líneas</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Cargando…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && data?.items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No hay asientos registrados.</td></tr>
              )}
              {!loading && !error && data?.items.map((e) => (
                <tr key={e.id}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  onClick={() => openDetail(e.id)}>
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {e.entryNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {fmtDate(e.entryDate)}
                  </td>
                  <td className="px-4 py-3 max-w-[260px] truncate text-slate-600 dark:text-slate-300">
                    {e.description}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', REF_TYPE_COLORS[e.referenceType])}>
                      {REF_TYPE_LABELS[e.referenceType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                    S/ {fmtMoney(e.totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                    {e.lineCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {meta ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} asientos` : '—'}
          </p>
          <div className="flex gap-1">
            <button type="button" disabled={!meta?.hasPreviousPage || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <ChevronLeftIcon className="size-4" />
            </button>
            <button type="button" disabled={!meta?.hasNextPage || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      </Card>

      {selected && (
        <DetailModal entry={selected} onClose={() => setSelected(null)} />
      )}

      {showCreate && (
        <CreateEntryModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(1); setPage(1); }}
        />
      )}
    </>
  );
}

// ─── Modal de detalle ─────────────────────────────────────────────────────────

function DetailModal({ entry, onClose }: { entry: JournalEntryDetail; onClose: () => void }) {
  function fmtMoney(v: string | number) {
    return Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Asiento {entry.entryNumber}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {fmtDate(entry.entryDate)} · {REF_TYPE_LABELS[entry.referenceType]} · {entry.description}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Cuenta</th>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 text-right font-medium">Débito (S/)</th>
                <th className="px-4 py-2 text-right font-medium">Crédito (S/)</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((l) => (
                <tr key={l.lineNumber} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-2 text-slate-400">{l.lineNumber}</td>
                  <td className="px-4 py-2 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{l.accountCode}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{l.accountName}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-800 dark:text-slate-100">
                    {Number(l.debit) > 0 ? fmtMoney(l.debit) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-800 dark:text-slate-100">
                    {Number(l.credit) > 0 ? fmtMoney(l.credit) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total</td>
                <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                  {fmtMoney(entry.totalDebit)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                  {fmtMoney(entry.totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de creación ────────────────────────────────────────────────────────

const EMPTY_LINE = () => ({ accountCode: '', accountName: '', debit: 0, credit: 0 });

const REF_TYPES: JournalReferenceType[] = ['sale', 'purchase', 'purchase_return', 'credit_note', 'manual'];

function CreateEntryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<CreateJournalEntryRequest>({
    entryDate: today,
    description: '',
    referenceType: 'manual',
    lines: [EMPTY_LINE(), EMPTY_LINE()],
  });
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [created, setCreated]   = useState<string | null>(null);

  function setField<K extends keyof CreateJournalEntryRequest>(k: K, v: CreateJournalEntryRequest[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function updateLine(i: number, field: string, val: string | number) {
    setForm((f) => {
      const lines = [...f.lines];
      lines[i] = { ...lines[i], [field]: val };
      return { ...f, lines };
    });
  }

  function addLine() {
    setForm((f) => ({ ...f, lines: [...f.lines, EMPTY_LINE()] }));
  }

  function removeLine(i: number) {
    if (form.lines.length <= 2) return;
    setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  }

  const sumDebit  = form.lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0);
  const sumCredit = form.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(sumDebit - sumCredit) < 0.001 && sumDebit > 0;

  const canSubmit =
    form.description.trim() !== '' &&
    form.entryDate !== '' &&
    form.lines.every((l) => l.accountCode.trim() !== '') &&
    isBalanced &&
    !saving;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setApiError(null);
    try {
      const result = await api.journal.create(form);
      setCreated(result.entryNumber);
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'No se pudo crear el asiento.');
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCreated} />
        <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 text-4xl">✅</div>
          <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Asiento registrado</h2>
          <p className="mb-6 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">{created}</p>
          <Button onClick={onCreated}>Cerrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nuevo asiento contable</h2>
          <button type="button" onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="je-date">Fecha *</label>
              <input id="je-date" type="date" className={inputClass}
                value={form.entryDate}
                onChange={(e) => setField('entryDate', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="je-type">Tipo *</label>
              <select id="je-type" className={inputClass}
                value={form.referenceType}
                onChange={(e) => setField('referenceType', e.target.value as JournalReferenceType)}>
                {REF_TYPES.map((t) => (
                  <option key={t} value={t}>{REF_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className={labelClass} htmlFor="je-desc">Descripción *</label>
              <input id="je-desc" type="text" className={inputClass}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)} />
            </div>
          </div>

          {/* Líneas */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Líneas (partida doble)</p>
              <button type="button" onClick={addLine}
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                + Agregar línea
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-400 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-3 py-2 font-medium">Cta.</th>
                    <th className="px-3 py-2 font-medium">Nombre</th>
                    <th className="px-3 py-2 text-right font-medium">Débito</th>
                    <th className="px-3 py-2 text-right font-medium">Crédito</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((l, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-2 py-1">
                        <input type="text" className={`${inputClass} w-24 font-mono text-xs`}
                          placeholder="1211"
                          value={l.accountCode}
                          onChange={(e) => updateLine(i, 'accountCode', e.target.value)} />
                      </td>
                      <td className="px-2 py-1">
                        <input type="text" className={`${inputClass} min-w-[140px]`}
                          placeholder="Nombre de cuenta"
                          value={l.accountName}
                          onChange={(e) => updateLine(i, 'accountName', e.target.value)} />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" min={0} step={0.01} className={`${inputClass} w-28 text-right`}
                          value={l.debit}
                          onChange={(e) => updateLine(i, 'debit', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" min={0} step={0.01} className={`${inputClass} w-28 text-right`}
                          value={l.credit}
                          onChange={(e) => updateLine(i, 'credit', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-2 py-1">
                        <button type="button" disabled={form.lines.length <= 2}
                          onClick={() => removeLine(i)}
                          className="text-slate-400 hover:text-red-500 disabled:opacity-30">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Totales</td>
                    <td className={cn('px-3 py-2 text-right tabular-nums text-sm font-bold',
                      isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600')}>
                      {sumDebit.toFixed(2)}
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums text-sm font-bold',
                      isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600')}>
                      {sumCredit.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {!isBalanced && sumDebit > 0 && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                El asiento no cuadra: débitos {sumDebit.toFixed(2)} ≠ créditos {sumCredit.toFixed(2)}.
              </p>
            )}
          </div>

          {apiError && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {apiError}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {saving ? 'Guardando…' : 'Registrar asiento'}
          </Button>
        </div>
      </div>
    </div>
  );
}
