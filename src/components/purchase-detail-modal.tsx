'use client';

import { useEffect, useState } from 'react';
import { api, type Purchase } from '@/lib/api';
import { CloseIcon } from './icons';
import { formatCurrency } from '@/lib/format';

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

export function PurchaseDetailModal({
  purchaseId,
  supplierName,
  onClose,
}: {
  purchaseId: string;
  supplierName?: string;
  onClose: () => void;
}) {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.purchases
      .get(purchaseId, c.signal)
      .then(async (p) => {
        if (c.signal.aborted) return;
        setPurchase(p);
        const ids = [...new Set(p.purchaseDetails.map((l) => l.productId))];
        const entries = await Promise.all(
          ids.map((id) =>
            api.products
              .get(id, c.signal)
              .then((prod) => [id, prod.productName] as const)
              .catch(() => [id, id] as const),
          ),
        );
        if (!c.signal.aborted) setProductNames(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!c.signal.aborted) setError('No se pudo cargar la compra.');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [purchaseId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de la compra"
        className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Detalle de la compra
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-slate-400">
              <span className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400" />
              <span className="text-sm">Cargando…</span>
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-500">{error}</p>
          ) : purchase ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoItem
                  label="Proveedor"
                  value={supplierName ?? purchase.supplierId}
                />
                <InfoItem
                  label="Fecha"
                  value={`${purchase.purchaseDate} ${purchase.purchaseHour}`}
                />
                <InfoItem
                  label="Líneas"
                  value={String(purchase.purchaseDetails.length)}
                />
              </div>

              <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Producto</th>
                      <th className="px-3 py-2 text-center font-medium">Cant.</th>
                      <th className="px-3 py-2 text-right font-medium">P. unit.</th>
                      <th className="px-3 py-2 text-right font-medium">Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.purchaseDetails.map((l) => (
                      <tr
                        key={l.item}
                        className="border-t border-slate-100 dark:border-slate-800"
                      >
                        <td className="px-3 py-2 tabular-nums text-slate-400 dark:text-slate-500">
                          {l.item}
                        </td>
                        <td className="px-3 py-2 text-slate-800 dark:text-slate-200">
                          {productNames[l.productId] ?? l.productId}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-slate-600 dark:text-slate-400">
                          {l.quantity}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {formatCurrency(l.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                          {formatCurrency(l.partial)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
                  <dd className="tabular-nums text-slate-700 dark:text-slate-200">
                    {formatCurrency(purchase.subTotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">IGV (18%)</dt>
                  <dd className="tabular-nums text-slate-700 dark:text-slate-200">
                    {formatCurrency(purchase.igv)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 dark:border-slate-700">
                  <dt className="font-semibold text-slate-900 dark:text-white">Total</dt>
                  <dd className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(purchase.total)}
                  </dd>
                </div>
              </dl>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
