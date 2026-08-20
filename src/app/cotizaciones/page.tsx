'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  api,
  ApiError,
  type Client,
  type CreateQuoteDetailItem,
  type Paginated,
  type Product,
  type QuoteDetail,
  type QuoteSummary,
  type QuoteStatus,
  type UpdateQuoteStatusRequest,
} from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft:    'Borrador',
  sent:     'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired:  'Vencida',
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  sent:     'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  expired:  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

const NEXT_STATUSES: Record<QuoteStatus, { label: string; value: Exclude<QuoteStatus, 'draft'> }[]> = {
  draft:    [{ label: 'Enviar', value: 'sent' }, { label: 'Rechazar', value: 'rejected' }],
  sent:     [{ label: 'Aceptar', value: 'accepted' }, { label: 'Rechazar', value: 'rejected' }, { label: 'Vencer', value: 'expired' }],
  accepted: [],
  rejected: [],
  expired:  [],
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CotizacionesPage() {
  const [data, setData]           = useState<Paginated<QuoteSummary> | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [page, setPage]           = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail]       = useState<QuoteDetail | null>(null);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);

  const load = useCallback((p = page) => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.quotes
      .list({ page: p, limit: 20 }, c.signal)
      .then((res) => { setData(res); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar las cotizaciones.'); setLoading(false); });
    return c;
  }, [page]);

  useEffect(() => {
    const c = load(page);
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function changeStatus(quoteId: string, status: Exclude<QuoteStatus, 'draft'>) {
    setStatusBusy(quoteId);
    try {
      await api.quotes.updateStatus(quoteId, { status } as UpdateQuoteStatusRequest);
      load(page);
    } catch {
      // silent — list reload shows new state
    } finally {
      setStatusBusy(null);
    }
  }

  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Cotizaciones"
        subtitle="Correlativo COT-XXXXXXXXXX. Propuestas de precio para clientes."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="size-4" />
            Nueva cotización
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Vence</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
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
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No hay cotizaciones.</td></tr>
              )}
              {!loading && !error && data?.items.map((q) => (
                <tr key={q.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {q.number}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-slate-600 dark:text-slate-300">
                    {q.clientName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(q.date)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(q.validUntil)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[q.status])}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                    {formatCurrency(q.total)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-1"
                        onClick={() => {
                          api.quotes.get(q.id).then(setDetail);
                        }}
                      >
                        Ver
                      </button>
                      {NEXT_STATUSES[q.status].map((ns) => (
                        <button
                          key={ns.value}
                          type="button"
                          disabled={statusBusy === q.id}
                          onClick={() => changeStatus(q.id, ns.value)}
                          className="inline-flex rounded px-1.5 py-0.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {ns.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {meta
              ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} cotizaciones`
              : '—'}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!meta?.hasPreviousPage || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              disabled={!meta?.hasNextPage || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      </Card>

      {showCreate && (
        <CreateQuoteModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(1); setPage(1); }}
        />
      )}

      {detail && (
        <QuoteDetailModal
          quote={detail}
          onClose={() => setDetail(null)}
          onStatusChange={(id, status) => {
            setDetail(null);
            changeStatus(id, status);
          }}
        />
      )}
    </>
  );
}

// ─── Modal detalle ────────────────────────────────────────────────────────────

function QuoteDetailModal({
  quote,
  onClose,
  onStatusChange,
}: {
  quote: QuoteDetail;
  onClose: () => void;
  onStatusChange: (id: string, status: Exclude<QuoteStatus, 'draft'>) => void;
}) {
  const igvRate = 0.18;
  const nextStatuses = NEXT_STATUSES[quote.status];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{quote.number}</h2>
            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[quote.status])}>
              {STATUS_LABELS[quote.status]}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">Fecha emisión:</span> <span className="font-medium">{fmtDate(quote.date)}</span></div>
            <div><span className="text-slate-400">Válida hasta:</span> <span className="font-medium">{fmtDate(quote.validUntil)}</span></div>
          </div>

          {quote.notes && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {quote.notes}
            </p>
          )}

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Producto</th>
                  <th className="px-3 py-2 text-right font-medium">Cant.</th>
                  <th className="px-3 py-2 text-right font-medium">Precio unit.</th>
                  <th className="px-3 py-2 text-right font-medium">Parcial</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((l) => (
                  <tr key={l.item} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 text-slate-400">{l.item}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{l.productId.slice(0, 8)}…</td>
                    <td className="px-3 py-2 text-right tabular-nums">{l.quantity}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(l.unitPrice)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(l.partial)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-6 text-sm">
            <div className="text-right">
              <div className="text-slate-400">Subtotal</div>
              <div className="font-semibold tabular-nums">{formatCurrency(quote.subTotal)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400">IGV (18%)</div>
              <div className="font-semibold tabular-nums">{formatCurrency(quote.igv)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400">Total</div>
              <div className="text-lg font-bold tabular-nums">{formatCurrency(quote.total)}</div>
            </div>
          </div>
        </div>

        {nextStatuses.length > 0 && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
            {nextStatuses.map((ns) => (
              <Button
                key={ns.value}
                variant={ns.value === 'accepted' ? 'primary' : 'secondary'}
                onClick={() => onStatusChange(quote.id, ns.value)}
              >
                {ns.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal de creación ────────────────────────────────────────────────────────

interface DraftLine {
  item: number;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

function CreateQuoteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchingProduct, setSearchingProduct] = useState(false);

  const [lines, setLines]           = useState<DraftLine[]>([]);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes]           = useState('');

  const [saving, setSaving]         = useState(false);
  const [apiError, setApiError]     = useState<string | null>(null);
  const [createdNumber, setCreatedNumber] = useState<string | null>(null);

  function searchClients(term: string) {
    if (!term.trim()) { setClientResults([]); return; }
    api.clients
      .list({ clientDescription: term.trim(), limit: 8 })
      .then((res) => setClientResults(res.items ?? []))
      .catch(() => {});
  }

  function searchProducts(term: string) {
    if (!term.trim()) { setProductResults([]); return; }
    setSearchingProduct(true);
    api.products
      .query({ productDescription: term.trim(), productActive: true, limit: 8 })
      .then((res) => setProductResults(res.items ?? []))
      .catch(() => {})
      .finally(() => setSearchingProduct(false));
  }

  function addProduct(p: Product) {
    setProductSearch('');
    setProductResults([]);
    if (lines.find((l) => l.productId === p.productId)) return;
    setLines((prev) => [
      ...prev,
      {
        item: prev.length + 1,
        productId: p.productId,
        productName: p.productName,
        unitPrice: p.productUnitPrice,
        quantity: 1,
      },
    ]);
  }

  function removeLine(productId: string) {
    setLines((prev) => {
      const filtered = prev.filter((l) => l.productId !== productId);
      return filtered.map((l, i) => ({ ...l, item: i + 1 }));
    });
  }

  function setQty(productId: string, qty: number) {
    setLines((prev) =>
      prev.map((l) => l.productId === productId ? { ...l, quantity: Math.max(1, qty) } : l),
    );
  }

  const subTotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const igv      = subTotal * 0.18;
  const total    = subTotal + igv;

  const canSubmit =
    selectedClient !== null &&
    lines.length > 0 &&
    validUntil.trim() !== '' &&
    !saving;

  async function submit() {
    if (!canSubmit || !selectedClient) return;
    setSaving(true);
    setApiError(null);
    try {
      const details: CreateQuoteDetailItem[] = lines.map((l) => ({
        item:      l.item,
        productId: l.productId,
        quantity:  l.quantity,
      }));
      const result = await api.quotes.create({
        clientId:   selectedClient.clientId,
        validUntil: validUntil,
        notes:      notes.trim() || undefined,
        details,
      });
      setCreatedNumber(result.number);
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'No se pudo crear la cotización.');
    } finally {
      setSaving(false);
    }
  }

  if (createdNumber) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCreated} />
        <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 text-4xl">✅</div>
          <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Cotización creada</h2>
          <p className="mb-6 font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">{createdNumber}</p>
          <Button onClick={onCreated}>Cerrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nueva cotización</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5">
          {/* Cliente */}
          <div>
            <label className={labelClass}>Cliente <span className="text-red-500">*</span></label>
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
                <span className="font-medium text-emerald-800 dark:text-emerald-300">{selectedClient.clientDescription}</span>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Buscar cliente por nombre o RUC…"
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); searchClients(e.target.value); }}
                />
                {clientResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    {clientResults.map((c) => (
                      <button
                        key={c.clientId}
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        onClick={() => { setSelectedClient(c); setClientSearch(''); setClientResults([]); }}
                      >
                        <span className="font-medium">{c.clientDescription}</span>
                        <span className="text-xs text-slate-400">{c.documentNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fecha de vencimiento */}
          <div>
            <label className={labelClass} htmlFor="q-valid-until">
              Válida hasta <span className="text-red-500">*</span>
            </label>
            <input
              id="q-valid-until"
              type="date"
              className={inputClass}
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>

          {/* Agregar productos */}
          <div>
            <label className={labelClass}>Productos</label>
            <div className="relative">
              <input
                type="text"
                className={inputClass}
                placeholder="Buscar producto por nombre…"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
              />
              {productResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {productResults.map((p) => (
                    <button
                      key={p.productId}
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      onClick={() => addProduct(p)}
                    >
                      <span className="font-medium">{p.productName}</span>
                      <span className="text-xs text-slate-400">{formatCurrency(p.productUnitPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabla de líneas */}
          {lines.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Producto</th>
                    <th className="px-3 py-2 text-right font-medium">Precio</th>
                    <th className="px-3 py-2 text-right font-medium">Cant.</th>
                    <th className="px-3 py-2 text-right font-medium">Parcial</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.productId} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 max-w-[200px] truncate">
                        {l.productName}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(l.unitPrice)}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className={`${inputClass} w-20 text-right`}
                          value={l.quantity}
                          onChange={(e) => setQty(l.productId, Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {formatCurrency(l.unitPrice * l.quantity)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeLine(l.productId)}
                          className="text-slate-300 hover:text-red-500"
                          aria-label="Eliminar línea"
                        >
                          <CloseIcon className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end gap-6 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
                <div className="text-right">
                  <div className="text-slate-400">Subtotal</div>
                  <div className="font-semibold tabular-nums">{formatCurrency(subTotal)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">IGV (18%)</div>
                  <div className="font-semibold tabular-nums">{formatCurrency(igv)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">Total</div>
                  <div className="text-lg font-bold tabular-nums">{formatCurrency(total)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className={labelClass} htmlFor="q-notes">Notas internas (opcional)</label>
            <textarea
              id="q-notes"
              className={`${inputClass} min-h-16 resize-y`}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condiciones de pago, términos, observaciones…"
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
            {saving ? 'Guardando…' : 'Crear cotización'}
          </Button>
        </div>
      </div>
    </div>
  );
}
