'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  api, ApiError,
  type CreateLotRequest, type LotStatus, type LotSummary, type Paginated,
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

function daysUntil(d: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(d + 'T00:00:00').getTime() - today.getTime()) / 86_400_000);
}

const STATUS_LABELS: Record<LotStatus, string> = {
  active:   'Activo',
  depleted: 'Agotado',
  expired:  'Vencido',
};

const STATUS_COLORS: Record<LotStatus, string> = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  depleted: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  expired:  'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

function expiryBadge(expirationDate: string, status: LotStatus) {
  if (status !== 'active') return null;
  const days = daysUntil(expirationDate);
  if (days < 0)  return <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">Vencido</span>;
  if (days <= 30) return <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{days}d</span>;
  return null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LotesPage() {
  const [data, setData]         = useState<Paginated<LotSummary> | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState<LotStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback((p = page) => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.lots
      .list({ status: statusFilter || undefined, page: p, limit: 20 }, c.signal)
      .then((res) => { setData(res); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar los lotes.'); setLoading(false); });
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  useEffect(() => {
    const c = load(page);
    return () => c.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Lotes y Vencimientos"
        subtitle="Control de lotes de productos con fechas de fabricación y vencimiento."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="size-4" />
            Nuevo lote
          </Button>
        }
      />

      {/* Filtro de estado */}
      <div className="mb-4 flex gap-2">
        {(['', 'active', 'depleted', 'expired'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              statusFilter === s
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300',
            )}
          >
            {s === '' ? 'Todos' : STATUS_LABELS[s as LotStatus]}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Almacén</th>
                <th className="px-4 py-3 font-medium">Vence</th>
                <th className="px-4 py-3 text-right font-medium">Inicial</th>
                <th className="px-4 py-3 text-right font-medium">Actual</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Cargando…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && data?.items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No hay lotes registrados.</td></tr>
              )}
              {!loading && !error && data?.items.map((lot) => (
                <tr key={lot.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {lot.lotNumber}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-slate-600 dark:text-slate-300">
                    {lot.productName}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {lot.warehouseCode}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {fmtDate(lot.expirationDate)}
                    {expiryBadge(lot.expirationDate, lot.status)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {lot.initialQuantity}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                    {lot.currentQuantity}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[lot.status])}>
                      {STATUS_LABELS[lot.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {meta ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} lotes` : '—'}
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

      {showCreate && (
        <CreateLotModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(1); setPage(1); }}
        />
      )}
    </>
  );
}

// ─── Modal de creación ────────────────────────────────────────────────────────

function CreateLotModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateLotRequest>({
    lotNumber: '',
    productId: '',
    warehouseId: '',
    expirationDate: '',
    initialQuantity: 1,
  });
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  function set<K extends keyof CreateLotRequest>(k: K, v: CreateLotRequest[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  const canSubmit =
    form.lotNumber.trim() !== '' &&
    form.productId.trim() !== '' &&
    form.warehouseId.trim() !== '' &&
    form.expirationDate !== '' &&
    form.initialQuantity >= 1 &&
    !saving;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setApiError(null);
    try {
      const result = await api.lots.create({
        ...form,
        lotNumber: form.lotNumber.trim(),
        manufacturingDate: form.manufacturingDate || undefined,
        notes: form.notes?.trim() || undefined,
      });
      setCreated(result.lotNumber);
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'No se pudo crear el lote.');
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
          <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Lote registrado</h2>
          <p className="mb-6 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">{created}</p>
          <Button onClick={onCreated}>Cerrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nuevo lote</h2>
          <button type="button" onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="lot-number">Número de lote *</label>
              <input id="lot-number" type="text" className={inputClass}
                placeholder="LOT-2026-001"
                value={form.lotNumber}
                onChange={(e) => set('lotNumber', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="lot-qty">Cantidad inicial *</label>
              <input id="lot-qty" type="number" min={1} step={1} className={inputClass}
                value={form.initialQuantity}
                onChange={(e) => set('initialQuantity', Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="lot-product">ID Producto *</label>
            <input id="lot-product" type="text" className={inputClass}
              placeholder="UUID del producto"
              value={form.productId}
              onChange={(e) => set('productId', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="lot-warehouse">ID Almacén *</label>
            <input id="lot-warehouse" type="text" className={inputClass}
              placeholder="UUID del almacén"
              value={form.warehouseId}
              onChange={(e) => set('warehouseId', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="lot-mfg">Fecha fabricación</label>
              <input id="lot-mfg" type="date" className={inputClass}
                value={form.manufacturingDate ?? ''}
                onChange={(e) => set('manufacturingDate', e.target.value || undefined)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="lot-exp">Fecha vencimiento *</label>
              <input id="lot-exp" type="date" className={inputClass}
                value={form.expirationDate}
                onChange={(e) => set('expirationDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="lot-notes">Notas</label>
            <textarea id="lot-notes" className={`${inputClass} min-h-16 resize-y`}
              maxLength={500}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
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
            {saving ? 'Guardando…' : 'Registrar lote'}
          </Button>
        </div>
      </div>
    </div>
  );
}
