'use client';

import { useEffect, useState } from 'react';
import {
  api,
  ApiError,
  type CreatePaymentRequest,
  type Paginated,
  type PaymentItem,
  type PaymentMethod,
  type PaymentReferenceType,
  type PaymentType,
} from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  check: 'Cheque',
};

const METHOD_ICON: Record<PaymentMethod, string> = {
  cash: '💵',
  transfer: '🏦',
  card: '💳',
  check: '📋',
};

const METHOD_COLOR: Record<PaymentMethod, string> = {
  cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  transfer: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  card: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  check: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

const REF_LABEL: Record<PaymentReferenceType, string> = {
  sale: 'Venta',
  purchase: 'Compra',
  credit_note: 'Nota de crédito',
  purchase_order: 'Orden de compra',
};

const TYPE_LABEL: Record<PaymentType, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
};

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [data, setData] = useState<Paginated<PaymentItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [refType, setRefType] = useState<PaymentReferenceType | ''>('');
  const [payType, setPayType] = useState<PaymentType | ''>('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  function load(p = page) {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.payments
      .list(
        {
          referenceType: refType || undefined,
          paymentType: payType || undefined,
          paymentMethod: method || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page: p,
          limit: 20,
        },
        c.signal,
      )
      .then((res) => { setData(res); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar los pagos.'); setLoading(false); });
    return c;
  }

  useEffect(() => {
    const c = load(page);
    return () => c.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refType, payType, method, dateFrom, dateTo]);

  function resetFilters() {
    setRefType(''); setPayType(''); setMethod(''); setDateFrom(''); setDateTo(''); setPage(1);
  }

  async function deletePayment(id: string) {
    if (!confirm('¿Eliminar este pago? La acción no se puede deshacer.')) return;
    try {
      await api.payments.remove(id);
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((p) => p.id !== id), meta: { ...prev.meta, total: prev.meta.total - 1 } }
          : prev,
      );
    } catch {
      alert('No se pudo eliminar el pago.');
    }
  }

  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Pagos"
        subtitle="Registro polimórfico de ingresos y egresos por documento."
        action={
          <Button onClick={() => setShowModal(true)}>
            <PlusIcon className="size-4" />
            Nuevo pago
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <select aria-label="Tipo de documento" className={`${inputClass} w-44`} value={refType}
            onChange={(e) => { setRefType(e.target.value as PaymentReferenceType | ''); setPage(1); }}>
            <option value="">Todos los documentos</option>
            {(Object.entries(REF_LABEL) as [PaymentReferenceType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <select aria-label="Tipo de pago" className={`${inputClass} w-36`} value={payType}
            onChange={(e) => { setPayType(e.target.value as PaymentType | ''); setPage(1); }}>
            <option value="">Ingreso / Egreso</option>
            {(Object.entries(TYPE_LABEL) as [PaymentType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <select aria-label="Método" className={`${inputClass} w-36`} value={method}
            onChange={(e) => { setMethod(e.target.value as PaymentMethod | ''); setPage(1); }}>
            <option value="">Todos los métodos</option>
            {(Object.entries(METHOD_LABEL) as [PaymentMethod, string][]).map(([v, l]) => (
              <option key={v} value={v}>{METHOD_ICON[v]} {l}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input type="date" aria-label="Desde" className={`${inputClass} w-36`} value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            <input type="date" aria-label="Hasta" className={`${inputClass} w-36`} value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>

          <button type="button" onClick={resetFilters}
            className="text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400">
            Limpiar
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 text-center font-medium">Método</th>
                <th className="px-4 py-3 text-center font-medium">Tipo</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Notas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Cargando…</td></tr>}
              {!loading && error && <tr><td colSpan={7} className="px-4 py-12 text-center text-red-500">{error}</td></tr>}
              {!loading && !error && data?.items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No hay pagos registrados.</td></tr>
              )}
              {!loading && !error && data?.items.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(p.paymentDate)}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-400">{REF_LABEL[p.referenceType]}</div>
                    <div className="font-mono text-xs text-slate-500">{p.referenceId.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', METHOD_COLOR[p.paymentMethod])}>
                      {METHOD_ICON[p.paymentMethod]} {METHOD_LABEL[p.paymentMethod]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      p.paymentType === 'income'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                    )}>
                      {TYPE_LABEL[p.paymentType]}
                    </span>
                  </td>
                  <td className={cn(
                    'px-4 py-3 text-right font-semibold tabular-nums',
                    p.paymentType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                  )}>
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-xs text-slate-500">{p.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => deletePayment(p.id)}
                      className="text-slate-400 transition hover:text-red-500" title="Eliminar pago">
                      <CloseIcon className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {meta ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} pago${meta.total === 1 ? '' : 's'}` : '—'}
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

      {showModal && (
        <CreatePaymentModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(1); setPage(1); }}
        />
      )}
    </>
  );
}

// ─── Modal de creación ───────────────────────────────────────────────────────

function CreatePaymentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [paymentType, setPaymentType] = useState<PaymentType>('income');
  const [referenceType, setReferenceType] = useState<PaymentReferenceType>('sale');
  const [referenceId, setReferenceId] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const amountNum = Number(amount);
  const valid =
    referenceId.trim().length > 0 &&
    paymentDate !== '' &&
    amount !== '' &&
    Number.isFinite(amountNum) &&
    amountNum > 0;

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    setApiError(null);
    try {
      const body: CreatePaymentRequest = {
        paymentType,
        referenceType,
        referenceId: referenceId.trim(),
        paymentDate,
        amount: Math.round(amountNum * 100) / 100,
        paymentMethod,
        notes: notes.trim() || undefined,
      };
      await api.payments.create(body);
      onCreated();
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'No se pudo registrar el pago.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Registrar pago</h2>
          <button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="pay-type">Tipo</label>
              <select id="pay-type" className={inputClass} value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
                <option value="income">💚 Ingreso</option>
                <option value="expense">🔴 Egreso</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="pay-method">Método</label>
              <select id="pay-method" className={inputClass} value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                {(Object.entries(METHOD_LABEL) as [PaymentMethod, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{METHOD_ICON[v]} {l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="pay-ref-type">Tipo de documento</label>
              <select id="pay-ref-type" className={inputClass} value={referenceType}
                onChange={(e) => setReferenceType(e.target.value as PaymentReferenceType)}>
                {(Object.entries(REF_LABEL) as [PaymentReferenceType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="pay-ref-id">ID del documento (UUID)</label>
              <input id="pay-ref-id" type="text" className={inputClass} placeholder="xxxxxxxx-xxxx-…"
                value={referenceId} onChange={(e) => setReferenceId(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="pay-date">Fecha <span className="text-red-500">*</span></label>
              <input id="pay-date" type="date" className={inputClass} value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="pay-amount">Monto (S/) <span className="text-red-500">*</span></label>
              <input id="pay-amount" type="number" min={0.01} step="0.01" className={inputClass} placeholder="0.00"
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="pay-notes">Notas (opcional)</label>
            <textarea id="pay-notes" className={`${inputClass} min-h-16 resize-y`} maxLength={500}
              value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones…" />
          </div>

          {apiError && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {apiError}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!valid || saving}>{saving ? 'Guardando…' : 'Registrar pago'}</Button>
        </div>
      </div>
    </div>
  );
}
