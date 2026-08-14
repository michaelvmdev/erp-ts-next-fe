'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ApiError,
  api,
  type Paginated,
  type PriceList,
  type SortDirection,
  type UpdatePriceListRequest,
} from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
} from '@/components/icons';
import { cn } from '@/lib/cn';
import { RoleGuard } from '@/components/role-guard';

const LIMIT = 10;

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function PriceListsPage() {
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortDir, setSortDir] = useState<SortDirection>('ASC');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Paginated<PriceList> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PriceList | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.priceLists
      .list(
        {
          priceListDescription: query || undefined,
          priceListActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
          sortDirection: sortDir,
          page,
          limit: LIMIT,
        },
        c.signal,
      )
      .then((res) => {
        if (!c.signal.aborted) setData(res);
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError('No se pudieron cargar las listas de precio. ¿Está activo el backend?');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [query, activeFilter, sortDir, page, refresh]);

  const meta = data?.meta;

  function applySearch() {
    setQuery(term.trim());
    setPage(1);
  }

  function resetFilters() {
    setTerm('');
    setQuery('');
    setActiveFilter('all');
    setSortDir('ASC');
    setPage(1);
  }

  async function toggleActive(pl: PriceList) {
    setTogglingId(pl.priceListId);
    try {
      await api.priceLists.update(pl.priceListId, { priceListActive: !pl.priceListActive });
      setRefresh((x) => x + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar el estado.');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <RoleGuard allowedRoles={['administrador', 'almacenero', 'contador']}>
      <PageHeader
        title="Listas de precio"
        subtitle="Gestión de listas de precio para productos."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon className="size-4" />
            Nueva lista
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="flex-1 lg:min-w-56">
            <div className="flex gap-2">
              <input
                type="text"
                className={inputClass}
                placeholder="Buscar por descripción…"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applySearch();
                }}
              />
              <Button onClick={applySearch} className="shrink-0" aria-label="Buscar">
                <SearchIcon className="size-4" />
              </Button>
            </div>
          </div>

          <select
            aria-label="Estado"
            className={`${inputClass} lg:w-36`}
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as typeof activeFilter);
              setPage(1);
            }}
          >
            <option value="all">Todos</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>

          <select
            aria-label="Ordenar"
            className={`${inputClass} lg:w-40`}
            value={sortDir}
            onChange={(e) => {
              setSortDir(e.target.value as SortDirection);
              setPage(1);
            }}
          >
            <option value="ASC">Descripción A-Z</option>
            <option value="DESC">Descripción Z-A</option>
          </select>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium">Vigencia desde</th>
                <th className="px-4 py-3 font-medium">Vigencia hasta</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && data && data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    No hay listas de precio que coincidan.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                data?.items.map((pl) => (
                  <tr
                    key={pl.priceListId}
                    className={cn(
                      'border-b border-slate-100 last:border-0 dark:border-slate-800',
                      !pl.priceListActive && 'opacity-50',
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      <Link
                        href={`/admin/price-lists/${pl.priceListId}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {pl.priceListDescription}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(pl.validFrom)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(pl.validTo)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          pl.priceListActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                        )}
                      >
                        {pl.priceListActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(pl);
                            setFormOpen(true);
                          }}
                          aria-label="Editar"
                          title="Editar"
                          className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(pl)}
                          disabled={togglingId === pl.priceListId}
                          aria-label={pl.priceListActive ? 'Desactivar' : 'Activar'}
                          title={pl.priceListActive ? 'Desactivar' : 'Activar'}
                          className={cn(
                            'inline-flex size-8 items-center justify-center rounded-md transition disabled:opacity-50',
                            pl.priceListActive
                              ? 'text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40'
                              : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-950/40',
                          )}
                        >
                          <PowerIcon className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Paginacion */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {meta
              ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} lista${meta.total === 1 ? '' : 's'}`
              : '—'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
              onClick={resetFilters}
            >
              Limpiar filtros
            </button>
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
        </div>
      </Card>

      {formOpen && (
        <PriceListFormModal
          priceList={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setEditing(null);
            setRefresh((x) => x + 1);
          }}
        />
      )}
    </RoleGuard>
  );
}

// --- Modal crear / editar ----------------------------------------------------

function PriceListFormModal({
  priceList,
  onClose,
  onSaved,
}: {
  priceList: PriceList | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = priceList !== null;
  const [description, setDescription] = useState(priceList?.priceListDescription ?? '');
  const [validFrom, setValidFrom] = useState(priceList?.validFrom?.slice(0, 10) ?? '');
  const [validTo, setValidTo] = useState(priceList?.validTo?.slice(0, 10) ?? '');
  const [active, setActive] = useState(priceList?.priceListActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = description.trim() !== '';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const patch: UpdatePriceListRequest = {};
        if (description !== priceList.priceListDescription) patch.priceListDescription = description;
        const from = validFrom || null;
        const to = validTo || null;
        if (from !== (priceList.validFrom?.slice(0, 10) ?? null)) patch.validFrom = from;
        if (to !== (priceList.validTo?.slice(0, 10) ?? null)) patch.validTo = to;
        if (active !== priceList.priceListActive) patch.priceListActive = active;
        await api.priceLists.update(priceList.priceListId, patch);
      } else {
        await api.priceLists.create({
          priceListDescription: description.trim(),
          validFrom: validFrom || null,
          validTo: validTo || null,
        });
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? Array.isArray(err.body?.message)
            ? err.body.message.join(' ')
            : err.message
          : 'No se pudo guardar la lista de precio.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Editar lista de precio' : 'Nueva lista de precio'}
        className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {editing ? 'Editar lista de precio' : 'Nueva lista de precio'}
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

        <div className="space-y-4 p-5">
          <div>
            <label className={labelClass} htmlFor="pl-desc">
              Descripción
            </label>
            <input
              id="pl-desc"
              type="text"
              className={inputClass}
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Lista mayorista 2025, Precios especiales…"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="pl-from">
                Vigencia desde{' '}
                <span className="font-normal text-slate-400">(opc.)</span>
              </label>
              <input
                id="pl-from"
                type="date"
                className={inputClass}
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="pl-to">
                Vigencia hasta{' '}
                <span className="font-normal text-slate-400">(opc.)</span>
              </label>
              <input
                id="pl-to"
                type="date"
                className={inputClass}
                value={validTo}
                min={validFrom || undefined}
                onChange={(e) => setValidTo(e.target.value)}
              />
            </div>
          </div>

          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Lista activa
            </label>
          )}

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear lista'}
          </Button>
        </div>
      </div>
    </div>
  );
}
