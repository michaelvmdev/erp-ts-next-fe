'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  api,
  ApiError,
  type CreatePurchaseOrderLineRequest,
  type CreatePurchaseOrderRequest,
  type Paginated,
  type Product,
  type PurchaseOrderStatus,
  type PurchaseOrderSummary,
  type Supplier,
} from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  received: 'Recibido',
  cancelled: 'Cancelado',
};

const STATUS_COLOR: Record<PurchaseOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  partial: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
};

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const [data, setData] = useState<Paginated<PurchaseOrderSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
  const [showModal, setShowModal] = useState(false);

  function load(p = page) {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.purchaseOrders
      .list({ status: statusFilter || undefined, page: p, limit: 20 }, c.signal)
      .then((res) => { setData(res); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar las órdenes.'); setLoading(false); });
    return c;
  }

  useEffect(() => {
    const c = load(page);
    return () => c.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Órdenes de Compra"
        subtitle="Gestión de pedidos a proveedores con máquina de estados."
        actions={
          <Button onClick={() => setShowModal(true)}>
            <PlusIcon className="size-4" />
            Nueva orden
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Estado"
            className={`${inputClass} w-40`}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as PurchaseOrderStatus | ''); setPage(1); }}
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABEL) as PurchaseOrderStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Líneas</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Cargando…</td></tr>}
              {!loading && error && <tr><td colSpan={6} className="px-4 py-12 text-center text-red-500">{error}</td></tr>}
              {!loading && !error && data?.items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No hay órdenes de compra.</td></tr>
              )}
              {!loading && !error && data?.items.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{o.supplierId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(o.date)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLOR[o.status])}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{o.lineCount}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/purchase-orders/${o.id}`} className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {meta ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} orden${meta.total === 1 ? '' : 'es'}` : '—'}
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
        <CreateOrderModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(1); setPage(1); }}
        />
      )}
    </>
  );
}

// ─── Modal de creación ───────────────────────────────────────────────────────

interface DraftLine extends CreatePurchaseOrderLineRequest {
  productName: string;
}

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);

  // Product search
  const [productTerm, setProductTerm] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productSearching, setProductSearching] = useState(false);

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    api.suppliers.list({ limit: 100, sortDirection: 'ASC' }, c.signal)
      .then((r) => setSuppliers(r.items))
      .catch(() => {});
    return () => c.abort();
  }, []);

  function searchProducts(term: string) {
    if (!term.trim()) { setProductResults([]); return; }
    setProductSearching(true);
    api.products.query({ productDescription: term.trim(), limit: 8 })
      .then((r) => setProductResults(r.items))
      .catch(() => {})
      .finally(() => setProductSearching(false));
  }

  function addProduct(p: Product) {
    setProductResults([]);
    setProductTerm('');
    if (lines.some((l) => l.productId === p.productId)) return;
    setLines((prev) => [...prev, { productId: p.productId, productName: p.productName, quantityOrdered: 1, unitPrice: 0 }]);
  }

  function updateLine(idx: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  const igvRate = 0.18;
  const subTotal = lines.reduce((s, l) => s + l.quantityOrdered * l.unitPrice, 0);
  const igv = subTotal * igvRate;
  const total = subTotal + igv;

  const valid = supplierId && date && lines.length > 0 && lines.every((l) => l.unitPrice > 0 && l.quantityOrdered > 0);

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    setApiError(null);
    try {
      const body: CreatePurchaseOrderRequest = {
        supplierId,
        date,
        notes: notes.trim() || undefined,
        lines: lines.map(({ productId, quantityOrdered, unitPrice }) => ({ productId, quantityOrdered, unitPrice })),
      };
      await api.purchaseOrders.create(body);
      onCreated();
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'No se pudo crear la orden.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nueva orden de compra</h2>
          <button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="po-supplier">Proveedor <span className="text-red-500">*</span></label>
              <select id="po-supplier" className={inputClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Seleccionar…</option>
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>{s.supplierDescription}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="po-date">Fecha <span className="text-red-500">*</span></label>
              <input id="po-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="po-notes">Notas (opcional)</label>
            <textarea id="po-notes" className={`${inputClass} min-h-16 resize-y`} maxLength={500} value={notes}
              onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones de la orden…" />
          </div>

          {/* Buscador de productos */}
          <div>
            <label className={labelClass}>Agregar producto</label>
            <div className="flex gap-2">
              <input type="text" className={inputClass} placeholder="Buscar por nombre…" value={productTerm}
                onChange={(e) => setProductTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchProducts(productTerm); }} />
              <Button onClick={() => searchProducts(productTerm)} disabled={productSearching} className="shrink-0">
                <SearchIcon className="size-4" />
              </Button>
            </div>
            {productResults.length > 0 && (
              <div className="mt-1 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {productResults.map((p) => (
                  <button key={p.productId} type="button"
                    className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() => addProduct(p)}>
                    <span>{p.productName}</span>
                    <span className="text-slate-400 text-xs">{formatCurrency(p.productUnitPrice)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Líneas */}
          {lines.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Producto</th>
                    <th className="px-3 py-2 text-right font-medium">Cant.</th>
                    <th className="px-3 py-2 text-right font-medium">Precio unit.</th>
                    <th className="px-3 py-2 text-right font-medium">Parcial</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.productId} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{l.productName}</td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" min={1} step={1} className={`${inputClass} w-20 text-right`}
                          value={l.quantityOrdered}
                          onChange={(e) => updateLine(i, { quantityOrdered: Number(e.target.value) })} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" min={0} step="0.01" className={`${inputClass} w-24 text-right`}
                          placeholder="0.00"
                          value={l.unitPrice || ''}
                          onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatCurrency(l.quantityOrdered * l.unitPrice)}
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeLine(i)}
                          className="text-slate-400 hover:text-red-500">
                          <CloseIcon className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end gap-6 border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
                <span className="text-slate-400">Subtotal <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(subTotal)}</span></span>
                <span className="text-slate-400">IGV <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(igv)}</span></span>
                <span className="font-bold">Total <span className="tabular-nums">{formatCurrency(total)}</span></span>
              </div>
            </div>
          )}

          {apiError && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {apiError}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!valid || saving}>{saving ? 'Creando…' : 'Crear orden'}</Button>
        </div>
      </div>
    </div>
  );
}
