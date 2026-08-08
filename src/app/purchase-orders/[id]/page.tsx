'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  api,
  ApiError,
  type PurchaseOrderDetail,
  type PurchaseOrderStatus,
} from '@/lib/api';
import { Button, Card, PageHeader } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

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

const TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  pending: ['partial', 'received', 'cancelled'],
  partial: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  function load() {
    const c = new AbortController();
    setLoading(true);
    api.purchaseOrders
      .get(id, c.signal)
      .then((o) => { setOrder(o); setLoading(false); })
      .catch(() => { setError('No se pudo cargar la orden.'); setLoading(false); });
    return c;
  }

  useEffect(() => {
    if (!id) return;
    const c = load();
    return () => c.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function transition(status: PurchaseOrderStatus) {
    if (!order) return;
    setTransitioning(true);
    setTransitionError(null);
    try {
      const updated = await api.purchaseOrders.update(order.id, { status });
      setOrder(updated);
    } catch (e) {
      setTransitionError(e instanceof ApiError ? e.message : 'No se pudo actualizar el estado.');
    } finally {
      setTransitioning(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Cargando…</div>;

  if (error || !order) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-red-500">{error ?? 'Orden no encontrada.'}</p>
        <Link href="/purchase-orders"><Button variant="secondary"><ChevronLeftIcon className="size-4" /> Volver</Button></Link>
      </div>
    );
  }

  const nextStatuses = TRANSITIONS[order.status];

  return (
    <>
      <PageHeader
        title={`Orden de compra · ${order.date}`}
        subtitle={`Proveedor: ${order.supplierId.slice(0, 8)}… · ${order.lines.length} línea${order.lines.length === 1 ? '' : 's'}`}
        actions={
          <Link href="/purchase-orders">
            <Button variant="secondary"><ChevronLeftIcon className="size-4" /> Volver</Button>
          </Link>
        }
      />

      {/* Estado y transiciones */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold', STATUS_COLOR[order.status])}>
          {STATUS_LABEL[order.status]}
        </span>

        {nextStatuses.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Cambiar a:</span>
            {nextStatuses.map((s) => (
              <button
                key={s}
                type="button"
                disabled={transitioning}
                onClick={() => transition(s)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium border transition-opacity',
                  STATUS_COLOR[s],
                  'border-current opacity-80 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {transitionError && (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {transitionError}
        </p>
      )}

      {order.notes && (
        <Card className="mb-6 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Notas</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{order.notes}</p>
        </Card>
      )}

      {/* Líneas */}
      <Card className="mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 text-right font-medium">Cant. pedida</th>
                <th className="px-4 py-3 text-right font-medium">Cant. recibida</th>
                <th className="px-4 py-3 text-right font-medium">Precio unit.</th>
                <th className="px-4 py-3 text-right font-medium">Parcial</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => {
                const fulfilled = l.quantityReceived >= l.quantityOrdered;
                return (
                  <tr key={l.item} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-4 py-3 text-slate-400">{l.item}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.productId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.quantityOrdered}</td>
                    <td className={cn('px-4 py-3 text-right tabular-nums font-medium', fulfilled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                      {l.quantityReceived}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(l.unitPrice)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(l.partial)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Totales */}
      <div className="flex justify-end">
        <Card className="w-64 divide-y divide-slate-100 p-0 dark:divide-slate-800">
          {[
            { label: 'Subtotal', value: order.subTotal },
            { label: 'IGV (18%)', value: order.igv },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-4 py-3 text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="tabular-nums">{formatCurrency(value)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold tabular-nums">{formatCurrency(order.total)}</span>
          </div>
        </Card>
      </div>
    </>
  );
}
