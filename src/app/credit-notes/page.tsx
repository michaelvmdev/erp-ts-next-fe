'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  api,
  ApiError,
  type CreditNoteSummary,
  type CreateCreditNoteDetailItem,
  type Paginated,
  type Sale,
  type SaleLine,
  type SaleSummary,
} from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreditNotesPage() {
  const [data, setData] = useState<Paginated<CreditNoteSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  function load(p = page) {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.creditNotes
      .list({ page: p, limit: 20 }, c.signal)
      .then((res) => { setData(res); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar las notas de crédito.'); setLoading(false); });
    return c;
  }

  useEffect(() => {
    const c = load(page);
    return () => c.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Notas de Crédito"
        subtitle="Correlativo NCA-XXXXXXXXXX. Corrección de ventas."
        action={
          <Button onClick={() => setShowModal(true)}>
            <PlusIcon className="size-4" />
            Nueva nota
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 font-medium">Líneas</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Cargando…</td></tr>}
              {!loading && error && <tr><td colSpan={6} className="px-4 py-12 text-center text-red-500">{error}</td></tr>}
              {!loading && !error && data?.items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No hay notas de crédito.</td></tr>
              )}
              {!loading && !error && data?.items.map((n) => (
                <tr key={n.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{n.number}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(n.date)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{n.reason}</td>
                  <td className="px-4 py-3 text-slate-500">{n.lineCount}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                    {formatCurrency(n.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/credit-notes/${n.id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
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
            {meta ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} notas` : '—'}
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
        <CreateCreditNoteModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(1); setPage(1); }}
        />
      )}
    </>
  );
}

// ─── Modal de creación ───────────────────────────────────────────────────────

interface DraftLine {
  productId: string;
  productName: string;
  maxQty: number;
  unitPrice: number;
  quantity: number;
}

function CreateCreditNoteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  // Step 1: select sale
  const [saleSearch, setSaleSearch] = useState('');
  const [saleResults, setSaleResults] = useState<SaleSummary[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Step 2: pick lines
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [reason, setReason] = useState('');

  // Step 3: submit
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdNumber, setCreatedNumber] = useState<string | null>(null);

  function searchSales(term: string) {
    if (!term.trim()) { setSaleResults([]); return; }
    setSearchLoading(true);
    api.sales.list({ saleNumber: term.trim(), limit: 10 })
      .then((res) => setSaleResults(res.items))
      .catch(() => {})
      .finally(() => setSearchLoading(false));
  }

  async function selectSale(summary: SaleSummary) {
    setSaleResults([]);
    setSaleSearch(summary.saleNumber);
    const detail = await api.sales.get(summary.saleId);
    setSelectedSale(detail);
    // Build draft lines from sale details
    setLines(
      detail.saleDetails.map((l: SaleLine) => ({
        productId: l.productId,
        productName: `Producto ${l.productId.slice(0, 8)}…`,
        maxQty: l.quantity,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      })),
    );
  }

  function setQty(productId: string, qty: number) {
    setLines((prev) =>
      prev.map((l) => l.productId === productId ? { ...l, quantity: Math.max(1, Math.min(qty, l.maxQty)) } : l),
    );
  }

  function toggleLine(productId: string, checked: boolean) {
    if (checked) return; // all lines checked by default; unchecking removes from draft
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  const igvRate = 0.18;
  const subTotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const igv = subTotal * igvRate;
  const total = subTotal + igv;

  async function submit() {
    if (!selectedSale || lines.length === 0 || !reason.trim()) return;
    setSaving(true);
    setApiError(null);
    try {
      const body = {
        saleId: selectedSale.saleId,
        reason: reason.trim(),
        creditNoteDetails: lines.map((l): CreateCreditNoteDetailItem => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
      };
      const result = await api.creditNotes.create(body);
      setCreatedNumber(result.number);
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'No se pudo crear la nota de crédito.');
    } finally {
      setSaving(false);
    }
  }

  // Success screen
  if (createdNumber) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCreated} />
        <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 text-4xl">✅</div>
          <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Nota emitida</h2>
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
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nueva nota de crédito</h2>
          <button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5">
          {/* Paso 1: Buscar venta */}
          <div>
            <label className={labelClass}>Buscar venta por número</label>
            <div className="flex gap-2">
              <input
                type="text"
                className={inputClass}
                placeholder="Ej: FAC-0000001234"
                value={saleSearch}
                onChange={(e) => setSaleSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchSales(saleSearch); }}
              />
              <Button onClick={() => searchSales(saleSearch)} disabled={searchLoading} className="shrink-0">
                {searchLoading ? '…' : 'Buscar'}
              </Button>
            </div>

            {saleResults.length > 0 && (
              <div className="mt-1 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {saleResults.map((s) => (
                  <button
                    key={s.saleId}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() => selectSale(s)}
                  >
                    <span className="font-mono font-semibold">{s.saleNumber}</span>
                    <span className="text-slate-500">{fmtDate(s.saleDate)} · {formatCurrency(s.total)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Paso 2: Líneas de la venta */}
          {selectedSale && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Venta {selectedSale.saleNumber} — selecciona productos y cantidades a devolver
              </p>
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 font-medium">Incl.</th>
                      <th className="px-3 py-2 font-medium">Producto</th>
                      <th className="px-3 py-2 text-right font-medium">Precio unit.</th>
                      <th className="px-3 py-2 text-right font-medium">Cant. devolver</th>
                      <th className="px-3 py-2 text-right font-medium">Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.saleDetails.map((sl: SaleLine) => {
                      const draft = lines.find((l) => l.productId === sl.productId);
                      const included = !!draft;
                      return (
                        <tr key={sl.productId} className={cn('border-t border-slate-100 dark:border-slate-800', !included && 'opacity-40')}>
                          <td className="px-3 py-2">
                            <input type="checkbox" className="size-4" checked={included}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setLines((prev) => [...prev, { productId: sl.productId, productName: '', maxQty: sl.quantity, unitPrice: sl.unitPrice, quantity: sl.quantity }]);
                                } else {
                                  toggleLine(sl.productId, false);
                                }
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-500">{sl.productId.slice(0, 8)}…</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(sl.unitPrice)}</td>
                          <td className="px-3 py-2 text-right">
                            {included && (
                              <input
                                type="number" min={1} max={sl.quantity} step={1}
                                className={`${inputClass} w-20 text-right`}
                                value={draft!.quantity}
                                onChange={(e) => setQty(sl.productId, Number(e.target.value))}
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {included ? formatCurrency(sl.unitPrice * draft!.quantity) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totales preview */}
              <div className="mt-3 flex justify-end gap-6 text-sm">
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

          {/* Motivo */}
          {selectedSale && (
            <div>
              <label className={labelClass} htmlFor="cn-reason">Motivo <span className="text-red-500">*</span></label>
              <textarea
                id="cn-reason"
                className={`${inputClass} min-h-20 resize-y`}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe el motivo de la nota de crédito…"
              />
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
          <Button
            onClick={submit}
            disabled={!selectedSale || lines.length === 0 || !reason.trim() || saving}
          >
            {saving ? 'Emitiendo…' : 'Emitir nota de crédito'}
          </Button>
        </div>
      </div>
    </div>
  );
}
