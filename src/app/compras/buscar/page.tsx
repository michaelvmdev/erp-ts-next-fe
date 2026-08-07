'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  api,
  type Paginated,
  type PurchaseSummary,
  type SortDirection,
  type Supplier,
} from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { PickerModal } from '@/components/picker-modal';
import { PurchaseDetailModal } from '@/components/purchase-detail-modal';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EyeIcon,
  SearchIcon,
} from '@/components/icons';
import { formatCurrency } from '@/lib/format';

const PAGE_SIZES = [5, 10, 25, 50] as const;

export default function BuscarComprasPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [totalMin, setTotalMin] = useState('');
  const [totalMax, setTotalMax] = useState('');
  const [applied, setApplied] = useState({
    dateFrom: '',
    dateTo: '',
    totalMin: '',
    totalMax: '',
  });

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('DESC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<typeof PAGE_SIZES[number]>(10);

  const [supplierNames, setSupplierNames] = useState<Record<string, string>>({});

  const [data, setData] = useState<Paginated<PurchaseSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.purchases
      .list(
        {
          supplierId: supplier?.supplierId,
          dateFrom: applied.dateFrom || undefined,
          dateTo: applied.dateTo || undefined,
          totalMin: applied.totalMin ? Number(applied.totalMin) : undefined,
          totalMax: applied.totalMax ? Number(applied.totalMax) : undefined,
          sortBy,
          sortDirection: sortDir,
          page,
          limit,
        },
        c.signal,
      )
      .then((res) => {
        if (!c.signal.aborted) setData(res);
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError('No se pudieron cargar las compras. ¿Está activo el backend?');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [applied, supplier, sortBy, sortDir, page, limit]);

  // Resolver nombres de proveedor de los que falten
  useEffect(() => {
    if (!data) return;
    const missing = [...new Set(data.items.map((p) => p.supplierId))].filter(
      (id) => !(id in supplierNames),
    );
    if (missing.length === 0) return;
    const c = new AbortController();
    Promise.all(
      missing.map((id) =>
        api.suppliers
          .get(id, c.signal)
          .then((s) => [id, s.supplierDescription] as const)
          .catch(() => [id, id] as const),
      ),
    ).then((entries) => {
      if (!c.signal.aborted)
        setSupplierNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const supplierName = useMemo(
    () => (id: string) => supplierNames[id] ?? '…',
    [supplierNames],
  );

  const meta = data?.meta;

  function applyFilters() {
    setApplied({ dateFrom, dateTo, totalMin, totalMax });
    setPage(1);
  }

  function resetFilters() {
    setDateFrom('');
    setDateTo('');
    setTotalMin('');
    setTotalMax('');
    setApplied({ dateFrom: '', dateTo: '', totalMin: '', totalMax: '' });
    setSupplier(null);
    setSortBy('date');
    setSortDir('DESC');
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Buscar compras"
        subtitle="Consulta y filtra las compras registradas."
      />

      {/* Filtros */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Desde</label>
            <input
              type="date"
              className={inputClass}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Hasta</label>
            <input
              type="date"
              className={inputClass}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Total mín (S/)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              placeholder="0"
              value={totalMin}
              onChange={(e) => setTotalMin(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
            />
          </div>

          <div>
            <label className={labelClass}>Total máx (S/)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              placeholder="—"
              value={totalMax}
              onChange={(e) => setTotalMax(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Proveedor</label>
            <div className="flex gap-2">
              <div className="flex-1 truncate rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                {supplier ? (
                  <span className="text-slate-800 dark:text-slate-100">
                    {supplier.supplierDescription}
                  </span>
                ) : (
                  <span className="text-slate-400">Todos</span>
                )}
              </div>
              {supplier && (
                <button
                  type="button"
                  onClick={() => { setSupplier(null); setPage(1); }}
                  aria-label="Quitar proveedor"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <CloseIcon className="size-4" />
                </button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSupplierPickerOpen(true)}
                aria-label="Buscar proveedor"
                className="shrink-0 px-2.5"
              >
                <SearchIcon className="size-5" />
              </Button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Ordenar por</label>
            <select
              className={inputClass}
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [by, dir] = e.target.value.split(':') as [
                  typeof sortBy,
                  SortDirection,
                ];
                setSortBy(by);
                setSortDir(dir);
                setPage(1);
              }}
            >
              <option value="date:DESC">Fecha (recientes)</option>
              <option value="date:ASC">Fecha (antiguas)</option>
              <option value="total:DESC">Total mayor</option>
              <option value="total:ASC">Total menor</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            className="text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
            onClick={resetFilters}
          >
            Limpiar filtros
          </button>
          <Button onClick={applyFilters}>
            <SearchIcon className="size-4" />
            Buscar
          </Button>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 text-center font-medium">Ítems</th>
                <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                <th className="px-4 py-3 text-right font-medium">IGV</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Ver</th>
              </tr>
            </thead>
            <tfoot className="border-t border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 text-center font-medium">Ítems</th>
                <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                <th className="px-4 py-3 text-right font-medium">IGV</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Ver</th>
              </tr>
            </tfoot>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && data && data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No hay compras que coincidan.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                data?.items.map((p) => (
                  <tr
                    key={p.purchaseId}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {p.purchaseDate}
                      <span className="ml-1 text-xs text-slate-400">{p.purchaseHour}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {supplierName(p.supplierId)}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-slate-500 dark:text-slate-400">
                      {p.lineCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {formatCurrency(p.subTotal)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {formatCurrency(p.igv)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailId(p.purchaseId)}
                        aria-label="Ver detalle"
                        title="Ver detalle"
                        className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <EyeIcon className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Por página:</span>
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value) as typeof PAGE_SIZES[number]); setPage(1); }}
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {meta
              ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} compra${meta.total === 1 ? '' : 's'}`
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
      </Card>

      {/* Modal: buscar proveedor para filtrar */}
      <PickerModal<Supplier>
        open={supplierPickerOpen}
        title="Filtrar por proveedor"
        searchPlaceholder="Nombre o RUC…"
        headers={['Proveedor', 'RUC']}
        getKey={(s) => s.supplierId}
        renderCells={(s) => [s.supplierDescription, s.supplierRuc]}
        fetchPage={(q, page, signal) => {
          const onlyDigits = /^\d+$/.test(q);
          return api.suppliers.list(
            {
              supplierDescription: !onlyDigits && q ? q : undefined,
              supplierRuc: onlyDigits && q ? q : undefined,
              page,
              limit: 5,
            },
            signal,
          );
        }}
        onSelect={(s) => {
          setSupplier(s);
          setSupplierNames((prev) => ({ ...prev, [s.supplierId]: s.supplierDescription }));
          setSupplierPickerOpen(false);
          setPage(1);
        }}
        onClose={() => setSupplierPickerOpen(false)}
      />

      {detailId && (
        <PurchaseDetailModal
          purchaseId={detailId}
          supplierName={
            data?.items.find((p) => p.purchaseId === detailId)?.supplierId
              ? supplierNames[data.items.find((p) => p.purchaseId === detailId)!.supplierId]
              : undefined
          }
          onClose={() => setDetailId(null)}
        />
      )}
    </>
  );
}
