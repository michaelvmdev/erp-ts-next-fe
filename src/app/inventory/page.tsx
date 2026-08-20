'use client';

import { useEffect, useState } from 'react';
import {
  api,
  type Paginated,
  type StockBalance,
  type StockMovement,
  type StockMovementType,
  type Warehouse,
} from '@/lib/api';
import { Button, Card, inputClass, PageHeader } from '@/components/ui';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

type Tab = 'saldos' | 'movimientos';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('saldos');

  const tabCls = (t: Tab) =>
    cn(
      'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
      tab === t
        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
    );

  return (
    <>
      <PageHeader title="Inventario" subtitle="Saldos de stock y movimientos de almacén." />
      <div className="mb-6 flex border-b border-slate-200 dark:border-slate-800">
        {(['saldos', 'movimientos'] as Tab[]).map((t) => (
          <button key={t} type="button" className={tabCls(t)} onClick={() => setTab(t)}>
            {t === 'saldos' ? 'Saldos' : 'Movimientos'}
          </button>
        ))}
      </div>
      {tab === 'saldos' && <SaldosTab />}
      {tab === 'movimientos' && <MovimientosTab />}
    </>
  );
}

// ─── Tab 1: Saldos ───────────────────────────────────────────────────────────

function SaldosTab() {
  const [warehouseId, setWarehouseId] = useState('');
  const [includeEmpty, setIncludeEmpty] = useState(false);
  const [page, setPage] = useState(1);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [data, setData] = useState<Paginated<StockBalance> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    api.warehouses.list({ limit: 100, sortDirection: 'ASC' }, c.signal)
      .then((r) => setWarehouses(r.items))
      .catch(() => {});
    return () => c.abort();
  }, []);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.inventory.listBalances(
      { warehouseId: warehouseId || undefined, includeEmpty, page, limit: 20 },
      c.signal,
    )
      .then((res) => { if (!c.signal.aborted) setData(res); })
      .catch(() => { if (!c.signal.aborted) setError('No se pudo cargar el stock.'); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [warehouseId, includeEmpty, page]);

  const meta = data?.meta;

  return (
    <>
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Almacén"
            className={`${inputClass} w-52`}
            value={warehouseId}
            onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
          >
            <option value="">Todos los almacenes</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseDescription}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300"
              checked={includeEmpty}
              onChange={(e) => { setIncludeEmpty(e.target.checked); setPage(1); }}
            />
            Incluir sin stock
          </label>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Almacén</th>
                <th className="px-4 py-3 text-right font-medium">Stock actual</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">Cargando…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && data?.items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">Sin resultados.</td></tr>
              )}
              {!loading && !error && data?.items.map((b) => (
                <tr
                  key={`${b.productId}-${b.warehouseId}`}
                  className={cn(
                    'border-b border-slate-100 last:border-0 dark:border-slate-800',
                    b.quantity === 0 && 'bg-red-50/60 dark:bg-red-950/20',
                  )}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{b.productCode}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{b.productName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <span className="text-xs text-slate-400 mr-1">{b.warehouseCode}</span>
                    {b.warehouseDescription}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
                      b.quantity === 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                        : b.quantity <= 5
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                    )}>
                      {b.quantity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar meta={meta} loading={loading} page={page} setPage={setPage} singular="registro" />
      </Card>
    </>
  );
}

// ─── Tab 2: Movimientos ──────────────────────────────────────────────────────

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  purchase_in: 'Entrada compra',
  sale_out: 'Salida venta',
  return_in: 'Devolución',
  purchase_return: 'Dev. compra',
  transfer_out: 'Transfer. salida',
  transfer_in: 'Transfer. entrada',
  adjustment: 'Ajuste',
};

const MOVEMENT_TYPE_COLOR: Record<StockMovementType, string> = {
  purchase_in: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  sale_out: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  return_in: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  purchase_return: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  transfer_out: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  transfer_in: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  adjustment: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

function MovimientosTab() {
  const [warehouseId, setWarehouseId] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [data, setData] = useState<Paginated<StockMovement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    api.warehouses.list({ limit: 100, sortDirection: 'ASC' }, c.signal)
      .then((r) => setWarehouses(r.items))
      .catch(() => {});
    return () => c.abort();
  }, []);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.inventory.listMovements(
      {
        warehouseId: warehouseId || undefined,
        movementType: movementType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 20,
      },
      c.signal,
    )
      .then((res) => { if (!c.signal.aborted) setData(res); })
      .catch(() => { if (!c.signal.aborted) setError('No se pudieron cargar los movimientos.'); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [warehouseId, movementType, dateFrom, dateTo, page]);

  const meta = data?.meta;

  return (
    <>
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <select
            aria-label="Almacén"
            className={`${inputClass} w-52`}
            value={warehouseId}
            onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
          >
            <option value="">Todos los almacenes</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseDescription}</option>
            ))}
          </select>

          <select
            aria-label="Tipo"
            className={`${inputClass} w-44`}
            value={movementType}
            onChange={(e) => { setMovementType(e.target.value as StockMovementType | ''); setPage(1); }}
          >
            <option value="">Todos los tipos</option>
            {(Object.entries(MOVEMENT_TYPE_LABELS) as [StockMovementType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input type="date" aria-label="Desde" className={`${inputClass} w-36`} value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            <input type="date" aria-label="Hasta" className={`${inputClass} w-36`} value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>

          <button
            type="button"
            className="text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
            onClick={() => { setWarehouseId(''); setMovementType(''); setDateFrom(''); setDateTo(''); setPage(1); }}
          >
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
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Almacén</th>
                <th className="px-4 py-3 text-center font-medium">Tipo</th>
                <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                <th className="px-4 py-3 text-right font-medium">Costo unit.</th>
                <th className="px-4 py-3 font-medium">Notas</th>
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
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Sin movimientos.</td></tr>
              )}
              {!loading && !error && data?.items.map((m) => {
                const isPositive = m.quantity > 0;
                return (
                  <tr key={m.movementId} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(m.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-100">{m.productName}</div>
                      <div className="text-xs text-slate-400 font-mono">{m.productCode}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="text-xs text-slate-400 mr-1">{m.warehouseCode}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', MOVEMENT_TYPE_COLOR[m.movementType])}>
                        {MOVEMENT_TYPE_LABELS[m.movementType]}
                      </span>
                    </td>
                    <td className={cn('px-4 py-3 text-right font-semibold tabular-nums', isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                      {isPositive ? '+' : ''}{m.quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {m.unitCost != null ? formatCurrency(m.unitCost) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {m.notes ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar meta={meta} loading={loading} page={page} setPage={setPage} singular="movimiento" />
      </Card>
    </>
  );
}

// ─── Shared pagination bar ────────────────────────────────────────────────────

function PaginationBar({
  meta, loading, page, setPage, singular,
}: {
  meta: { total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean; page: number } | undefined;
  loading: boolean;
  page: number;
  setPage: (fn: (p: number) => number) => void;
  singular: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {meta
          ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} ${singular}${meta.total === 1 ? '' : 's'}`
          : '—'}
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={!meta?.hasPreviousPage || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          aria-label="Página anterior"
          className="inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          disabled={!meta?.hasNextPage || loading}
          onClick={() => setPage((p) => p + 1)}
          aria-label="Página siguiente"
          className="inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
