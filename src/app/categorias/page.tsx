'use client';

import { useEffect, useState } from 'react';
import { ApiError, api, type Category, type Paginated, type SortDirection } from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
  TrashIcon,
} from '@/components/icons';
import { cn } from '@/lib/cn';

const LIMIT = 10;

export default function CategoriasPage() {
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortDir, setSortDir] = useState<SortDirection>('ASC');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Paginated<Category> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.categories
      .list(
        {
          categoryDescription: query || undefined,
          categoryActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
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
          setError('No se pudieron cargar las categorías. ¿Está activo el backend?');
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

  async function toggleActive(cat: Category) {
    setTogglingId(cat.categoryId);
    try {
      await api.categories.update(cat.categoryId, { categoryActive: !cat.categoryActive });
      setRefresh((x) => x + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar el estado.');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Categorías"
        subtitle="Categorías para clasificar productos."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon className="size-4" />
            Nueva categoría
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
                placeholder="Buscar por nombre…"
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
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>

          <select
            aria-label="Ordenar"
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
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && data && data.items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                    No hay categorías que coincidan.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                data?.items.map((cat) => (
                  <tr
                    key={cat.categoryId}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {cat.categoryDescription}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          cat.categoryActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                        )}
                      >
                        {cat.categoryActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(cat);
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
                          onClick={() => toggleActive(cat)}
                          disabled={togglingId === cat.categoryId}
                          aria-label={cat.categoryActive ? 'Desactivar' : 'Activar'}
                          title={cat.categoryActive ? 'Desactivar' : 'Activar'}
                          className={cn(
                            'inline-flex size-8 items-center justify-center rounded-md transition disabled:opacity-50',
                            cat.categoryActive
                              ? 'text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40'
                              : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-950/40',
                          )}
                        >
                          <PowerIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
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
              ? `Página ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} categoría${meta.total === 1 ? '' : 's'}`
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
        <CategoryFormModal
          category={editing}
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
        <DeleteCategoryModal
          category={deleteTarget}
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

// --- Modal crear / editar ----------------------------------------------------

function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = category !== null;
  const [description, setDescription] = useState(category?.categoryDescription ?? '');
  const [active, setActive] = useState(category?.categoryActive ?? true);
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
      const body = { categoryDescription: description.trim(), categoryActive: active };
      if (editing) {
        await api.categories.update(category.categoryId, body);
      } else {
        await api.categories.create(body);
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? Array.isArray(err.body?.message)
            ? err.body.message.join(' ')
            : err.message
          : 'No se pudo guardar la categoría.',
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
        aria-label={editing ? 'Editar categoría' : 'Nueva categoría'}
        className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {editing ? 'Editar categoría' : 'Nueva categoría'}
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
            <label className={labelClass} htmlFor="cat-desc">
              Nombre de la categoría
            </label>
            <input
              id="cat-desc"
              type="text"
              className={inputClass}
              maxLength={100}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              placeholder="Ej: Electrónica, Ropa, Alimentos…"
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Categoría activa
          </label>

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
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Modal eliminar ----------------------------------------------------------

function DeleteCategoryModal({
  category,
  onClose,
  onDeleted,
}: {
  category: Category;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleDelete() {
    setBusy(true);
    setErrorMsg(null);
    try {
      await api.categories.remove(category.categoryId);
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(true);
      } else {
        setErrorMsg(
          err instanceof ApiError ? err.message : 'No se pudo eliminar la categoría.',
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
      await api.categories.update(category.categoryId, { categoryActive: false });
      onDeleted();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'No se pudo desactivar la categoría.',
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
        aria-label="Eliminar categoría"
        className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="p-5">
          {!conflict ? (
            <>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                ¿Eliminar categoría?
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Se eliminará{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {category.categoryDescription}
                </span>{' '}
                de forma permanente.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Categoría con productos asociados
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                No se puede eliminar{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {category.categoryDescription}
                </span>{' '}
                porque tiene productos vinculados. ¿Deseas desactivarla en su lugar?
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
