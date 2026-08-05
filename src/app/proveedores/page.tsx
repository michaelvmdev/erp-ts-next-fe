'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  api,
  type CreateSupplierRequest,
  type Paginated,
  type SortDirection,
  type Supplier,
  type UpdateSupplierRequest,
} from '@/lib/api';
import { Button, Card, inputClass, PageHeader } from '@/components/ui';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
  TrashIcon,
} from '@/components/icons';
import { cn } from '@/lib/cn';

const LIMIT = 10;
const RUC_RE = /^20[0-9]{9}$/;

export default function ProveedoresPage() {
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortDir, setSortDir] = useState<SortDirection>('ASC');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Paginated<Supplier> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    const onlyDigits = /^\d+$/.test(query);
    api.suppliers
      .list(
        {
          supplierDescription: !onlyDigits && query ? query : undefined,
          supplierRuc: onlyDigits && query ? query : undefined,
          supplierActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
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
          setError('No se pudieron cargar los proveedores. ¿Está activo el backend?');
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

  async function toggleActive(supplier: Supplier) {
    setTogglingId(supplier.supplierId);
    try {
      await api.suppliers.update(supplier.supplierId, {
        supplierActive: !supplier.supplierActive,
      });
      setRefresh((x) => x + 1);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo cambiar el estado.',
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Proveedores"
        subtitle="Empresas proveedoras y su RUC."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon className="size-4" />
            Nuevo proveedor
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
                placeholder="Buscar por nombre o RUC…"
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
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <select
            aria-label="Ordenar por"
            className={`${inputClass} lg:w-36`}
            value={sortDir}
            onChange={(e) => {
              setSortDir(e.target.value as SortDirection);
              setPage(1);
            }}
          >
            <option value="ASC">Nombre A-Z</option>
            <option value="DESC">Nombre Z-A</option>
          </select>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">RUC</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && data && data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    No hay proveedores que coincidan.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                data?.items.map((s) => (
                  <tr
                    key={s.supplierId}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {s.supplierDescription}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {s.supplierRuc}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          s.supplierActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                        )}
                      >
                        {s.supplierActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(s);
                            setFormOpen(true);
                          }}
                          aria-label="Editar"
                          title="Editar"
                          className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(s)}
                          disabled={togglingId === s.supplierId}
                          aria-label={s.supplierActive ? 'Desactivar' : 'Activar'}
                          title={s.supplierActive ? 'Desactivar' : 'Activar'}
                          className={cn(
                            'inline-flex size-8 items-center justify-center rounded-md transition disabled:opacity-50',
                            s.supplierActive
                              ? 'text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40'
                              : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-950/40',
                          )}
                        >
                          <PowerIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          aria-label="Eliminar"
                          title="Eliminar"
                          className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40"
                        >
                          <TrashIcon className="size-4" />
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
              ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} proveedor${meta.total === 1 ? '' : 'es'}`
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
        <SupplierFormModal
          supplier={editing}
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

      {deleteTarget && (
        <DeleteSupplierModal
          supplier={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            setRefresh((x) => x + 1);
          }}
        />
      )}
    </>
  );
}

function SupplierFormModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = supplier !== null;
  const [description, setDescription] = useState(supplier?.supplierDescription ?? '');
  const [ruc, setRuc] = useState(supplier?.supplierRuc ?? '');
  const [active, setActive] = useState(supplier?.supplierActive ?? true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function validate(): string | null {
    if (!description.trim()) return 'El nombre es obligatorio.';
    if (!RUC_RE.test(ruc)) return 'El RUC debe tener 11 dígitos y comenzar con 20.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); return; }
    setBusy(true);
    setErrorMsg(null);
    try {
      if (isEdit) {
        const body: UpdateSupplierRequest = {};
        if (description !== supplier.supplierDescription) body.supplierDescription = description.trim();
        if (ruc !== supplier.supplierRuc) body.supplierRuc = ruc;
        if (active !== supplier.supplierActive) body.supplierActive = active;
        await api.suppliers.update(supplier.supplierId, body);
      } else {
        const body: CreateSupplierRequest = {
          supplierDescription: description.trim(),
          supplierRuc: ruc,
          supplierActive: active,
        };
        await api.suppliers.create(body);
      }
      onSaved();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'No se pudo guardar el proveedor.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Nombre / Razón social
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="Ej. Distribuidora Peru S.A.C."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={150}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                RUC
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="20xxxxxxxxx"
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                maxLength={11}
                required
              />
              <p className="mt-1 text-xs text-slate-400">11 dígitos, debe comenzar con 20.</p>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="size-4 rounded accent-indigo-600"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Activo</span>
            </label>

            {errorMsg && (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteSupplierModal({
  supplier,
  onClose,
  onDeleted,
}: {
  supplier: Supplier;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setErrorMsg(null);
    try {
      await api.suppliers.remove(supplier.supplierId);
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(true);
      } else {
        setErrorMsg(
          err instanceof ApiError ? err.message : 'No se pudo eliminar el proveedor.',
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate() {
    setBusy(true);
    setErrorMsg(null);
    try {
      await api.suppliers.update(supplier.supplierId, { supplierActive: false });
      onDeleted();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'No se pudo desactivar el proveedor.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Eliminar proveedor"
        className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="p-5">
          {!conflict ? (
            <>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                ¿Eliminar proveedor?
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Se eliminará{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {supplier.supplierDescription}
                </span>{' '}
                de forma permanente.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Proveedor con compras registradas
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                No se puede eliminar{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {supplier.supplierDescription}
                </span>{' '}
                porque tiene compras asociadas. ¿Deseas desactivarlo en su lugar?
              </p>
            </>
          )}

          {errorMsg && (
            <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {errorMsg}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          {!conflict ? (
            <Button
              onClick={handleDelete}
              disabled={busy}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
            >
              {busy ? 'Eliminando…' : 'Eliminar'}
            </Button>
          ) : (
            <Button onClick={handleDeactivate} disabled={busy}>
              {busy ? 'Desactivando…' : 'Desactivar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
