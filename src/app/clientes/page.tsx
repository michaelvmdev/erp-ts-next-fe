'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  api,
  type Client,
  type DocumentType,
  type Paginated,
  type SortDirection,
} from '@/lib/api';
import { Button, Card, inputClass, PageHeader } from '@/components/ui';
import { ClientFormModal } from '@/components/client-form-modal';
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

export default function ClientesPage() {
  // Filtros
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [sortBy, setSortBy] = useState<'description' | 'documentNumber'>(
    'description',
  );
  const [sortDir, setSortDir] = useState<SortDirection>('ASC');
  const [page, setPage] = useState(1);

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  const [data, setData] = useState<Paginated<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  useEffect(() => {
    const c = new AbortController();
    api.documentTypes
      .list(c.signal)
      .then(setDocumentTypes)
      .catch(() => {});
    return () => c.abort();
  }, []);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    const onlyDigits = /^\d+$/.test(query);
    api.clients
      .list(
        {
          clientDescription: !onlyDigits && query ? query : undefined,
          documentNumber: onlyDigits && query ? query : undefined,
          documentTypeId: docTypeFilter ? Number(docTypeFilter) : undefined,
          clientActive:
            activeFilter === 'all' ? undefined : activeFilter === 'active',
          sortBy,
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
          setError('No se pudieron cargar los clientes. ¿Esta activo el backend?');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [query, docTypeFilter, activeFilter, sortBy, sortDir, page, refresh]);

  const docTypeName = useMemo(() => {
    const m = new Map(
      documentTypes.map((d) => [d.documentTypeId, d.documentTypeDescription]),
    );
    return (id: number) => m.get(id) ?? String(id);
  }, [documentTypes]);

  const meta = data?.meta;

  function applySearch() {
    setQuery(term.trim());
    setPage(1);
  }

  function resetFilters() {
    setTerm('');
    setQuery('');
    setDocTypeFilter('');
    setActiveFilter('all');
    setSortBy('description');
    setSortDir('ASC');
    setPage(1);
  }

  async function toggleActive(client: Client) {
    setTogglingId(client.clientId);
    try {
      await api.clients.update(client.clientId, {
        clientActive: !client.clientActive,
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
        title="Clientes"
        subtitle="Padron de clientes y su documento."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon className="size-4" />
            Nuevo cliente
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
                placeholder="Buscar por nombre o documento…"
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
            aria-label="Tipo de documento"
            className={`${inputClass} lg:w-40`}
            value={docTypeFilter}
            onChange={(e) => {
              setDocTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los documentos</option>
            {documentTypes.map((d) => (
              <option key={d.documentTypeId} value={d.documentTypeId}>
                {d.documentTypeDescription}
              </option>
            ))}
          </select>

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
            className={`${inputClass} lg:w-40`}
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
            <option value="description:ASC">Nombre A-Z</option>
            <option value="description:DESC">Nombre Z-A</option>
            <option value="documentNumber:ASC">Documento ↑</option>
            <option value="documentNumber:DESC">Documento ↓</option>
          </select>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Tipo doc.</th>
                <th className="px-4 py-3 font-medium">N° documento</th>
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
                    No hay clientes que coincidan.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                data?.items.map((c) => (
                  <tr
                    key={c.clientId}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {c.clientDescription}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {docTypeName(c.documentTypeId)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {c.documentNumber}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          c.clientActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                        )}
                      >
                        {c.clientActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(c);
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
                          onClick={() => toggleActive(c)}
                          disabled={togglingId === c.clientId}
                          aria-label={c.clientActive ? 'Desactivar' : 'Activar'}
                          title={c.clientActive ? 'Desactivar' : 'Activar'}
                          className={cn(
                            'inline-flex size-8 items-center justify-center rounded-md transition disabled:opacity-50',
                            c.clientActive
                              ? 'text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40'
                              : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-950/40',
                          )}
                        >
                          <PowerIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
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
              ? `Pagina ${meta.page} de ${Math.max(1, meta.totalPages)} · ${meta.total} cliente${meta.total === 1 ? '' : 's'}`
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
        </div>
      </Card>

      {formOpen && (
        <ClientFormModal
          client={editing}
          documentTypes={documentTypes}
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
        <DeleteClientModal
          client={deleteTarget}
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

function DeleteClientModal({
  client,
  onClose,
  onDeleted,
}: {
  client: Client;
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
      await api.clients.remove(client.clientId);
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(true);
      } else {
        setErrorMsg(
          err instanceof ApiError ? err.message : 'No se pudo eliminar el cliente.',
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
      await api.clients.update(client.clientId, { clientActive: false });
      onDeleted();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'No se pudo desactivar el cliente.',
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
        aria-label="Eliminar cliente"
        className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="p-5">
          {!conflict ? (
            <>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                ¿Eliminar cliente?
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Se eliminará{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {client.clientDescription}
                </span>{' '}
                de forma permanente.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Cliente con ventas registradas
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                No se puede eliminar{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {client.clientDescription}
                </span>{' '}
                porque tiene ventas asociadas. ¿Deseas desactivarlo en su lugar?
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
