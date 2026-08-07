'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  api,
  type Client,
  type Paginated,
  type SaleSummary,
  type SaleType,
  type SortDirection,
} from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { PickerModal } from '@/components/picker-modal';
import { SaleDetailModal } from '@/components/sale-detail-modal';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EyeIcon,
  SearchIcon,
} from '@/components/icons';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

const PAGE_SIZES = [5, 10, 25, 50] as const;
const NUMBER_RE = /^[A-Za-z]{3}-\d{10}$/;

function saleTypeLabel(code: string, types: SaleType[]): string {
  const t = types.find((x) => x.saleTypeCode === code);
  return t ? t.saleTypeDescription : code;
}

export default function BuscarVentasPage() {
  // Filtros "borrador" (se aplican con Buscar / Enter).
  const [saleNumber, setSaleNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [totalMin, setTotalMin] = useState('');
  const [totalMax, setTotalMax] = useState('');
  const [applied, setApplied] = useState({
    saleNumber: '',
    dateFrom: '',
    dateTo: '',
    totalMin: '',
    totalMax: '',
  });

  // Filtros inmediatos.
  const [saleTypeCode, setSaleTypeCode] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'number' | 'total'>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('DESC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<typeof PAGE_SIZES[number]>(10);

  // Catalogos y cache de nombres.
  const [saleTypes, setSaleTypes] = useState<SaleType[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});

  const [data, setData] = useState<Paginated<SaleSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const numberInvalid = saleNumber !== '' && !NUMBER_RE.test(saleNumber);

  useEffect(() => {
    const c = new AbortController();
    api.saleTypes.list(c.signal).then(setSaleTypes).catch(() => {});
    return () => c.abort();
  }, []);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.sales
      .list(
        {
          saleNumber: NUMBER_RE.test(applied.saleNumber)
            ? applied.saleNumber
            : undefined,
          saleTypeCode: saleTypeCode || undefined,
          clientId: client?.clientId,
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
          setError('No se pudieron cargar las ventas. ¿Esta activo el backend?');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [applied, saleTypeCode, client, sortBy, sortDir, page, limit]);

  // Resolver nombres de cliente de la pagina actual (los que falten).
  useEffect(() => {
    if (!data) return;
    const missing = [
      ...new Set(data.items.map((s) => s.clientId)),
    ].filter((id) => !(id in clientNames));
    if (missing.length === 0) return;
    const c = new AbortController();
    Promise.all(
      missing.map((id) =>
        api.clients
          .get(id, c.signal)
          .then((cl) => [id, cl.clientDescription] as const)
          .catch(() => [id, id] as const),
      ),
    ).then((entries) => {
      if (!c.signal.aborted)
        setClientNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const clientName = useMemo(
    () => (id: string) => clientNames[id] ?? '…',
    [clientNames],
  );

  const meta = data?.meta;

  function applyFilters() {
    if (numberInvalid) return;
    setApplied({ saleNumber, dateFrom, dateTo, totalMin, totalMax });
    setPage(1);
  }

  function resetFilters() {
    setSaleNumber('');
    setDateFrom('');
    setDateTo('');
    setTotalMin('');
    setTotalMax('');
    setApplied({ saleNumber: '', dateFrom: '', dateTo: '', totalMin: '', totalMax: '' });
    setSaleTypeCode('');
    setClient(null);
    setSortBy('date');
    setSortDir('DESC');
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Buscar ventas"
        subtitle="Consulta y filtra los comprobantes emitidos."
      />

      {/* Filtros */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>N° comprobante</label>
            <input
              type="text"
              className={inputClass}
              placeholder="FAC-0000000001"
              value={saleNumber}
              onChange={(e) => setSaleNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
            />
            {numberInvalid && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Formato: ABC-0000000001
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Tipo</label>
            <select
              className={inputClass}
              value={saleTypeCode}
              onChange={(e) => {
                setSaleTypeCode(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {saleTypes.map((t) => (
                <option key={t.saleTypeId} value={t.saleTypeCode}>
                  {t.saleTypeDescription}
                </option>
              ))}
            </select>
          </div>

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
            <label className={labelClass}>Total min (S/)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              placeholder="0"
              value={totalMin}
              onChange={(e) => setTotalMin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Total max (S/)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              placeholder="—"
              value={totalMax}
              onChange={(e) => setTotalMax(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Cliente</label>
            <div className="flex gap-2">
              <div className="flex-1 truncate rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                {client ? (
                  <span className="text-slate-800 dark:text-slate-100">
                    {client.clientDescription}
                  </span>
                ) : (
                  <span className="text-slate-400">Todos</span>
                )}
              </div>
              {client && (
                <button
                  type="button"
                  onClick={() => setClient(null)}
                  aria-label="Quitar cliente"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <CloseIcon className="size-4" />
                </button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={() => setClientPickerOpen(true)}
                aria-label="Buscar cliente"
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
              <option value="number:ASC">Numero ↑</option>
              <option value="number:DESC">Numero ↓</option>
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
          <Button onClick={applyFilters} disabled={numberInvalid}>
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
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 text-center font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Ver</th>
              </tr>
            </thead>
            <tfoot className="border-t border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 text-center font-medium">Items</th>
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
                    No hay ventas que coincidan.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                data?.items.map((s) => (
                  <tr
                    key={s.saleId}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-100">
                      {s.saleNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {saleTypeLabel(s.saleTypeCode, saleTypes)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {s.saleDate}
                      <span className="ml-1 text-xs text-slate-400">
                        {s.saleHour}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {clientName(s.clientId)}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-slate-500 dark:text-slate-400">
                      {s.lineCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                      {formatCurrency(s.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailId(s.saleId)}
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

        {/* Paginacion */}
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
              ? `Pagina ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} venta${meta.total === 1 ? '' : 's'}`
              : '—'}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!meta?.hasPreviousPage || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Pagina anterior"
              className="inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              disabled={!meta?.hasNextPage || loading}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Pagina siguiente"
              className="inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Modal: buscar cliente para filtrar */}
      <PickerModal<Client>
        open={clientPickerOpen}
        title="Filtrar por cliente"
        searchPlaceholder="Nombre o numero de documento…"
        headers={['Cliente', 'Documento']}
        getKey={(c) => c.clientId}
        renderCells={(c) => [c.clientDescription, c.documentNumber]}
        fetchPage={(q, page, signal) => {
          const onlyDigits = /^\d+$/.test(q);
          return api.clients.list(
            {
              clientDescription: !onlyDigits && q ? q : undefined,
              documentNumber: onlyDigits && q ? q : undefined,
              page,
              limit: 5,
            },
            signal,
          );
        }}
        onSelect={(c) => {
          setClient(c);
          setClientNames((prev) => ({ ...prev, [c.clientId]: c.clientDescription }));
          setClientPickerOpen(false);
          setPage(1);
        }}
        onClose={() => setClientPickerOpen(false)}
      />

      {detailId && (
        <SaleDetailModal
          saleId={detailId}
          clientName={
            data?.items.find((s) => s.saleId === detailId)?.clientId
              ? clientNames[
                  data.items.find((s) => s.saleId === detailId)!.clientId
                ]
              : undefined
          }
          onClose={() => setDetailId(null)}
        />
      )}
    </>
  );
}
