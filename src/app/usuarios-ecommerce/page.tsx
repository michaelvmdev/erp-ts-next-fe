'use client';

import { useEffect, useRef, useState } from 'react';
import {
  api,
  type CreateUserEcommerceRequest,
  type Paginated,
  type UpdateUserEcommerceRequest,
  type UserEcommerce,
  type UserEcommerceSortBy,
  type SortDirection,
} from '@/lib/api';
import Link from 'next/link';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { CloseIcon, HistoryIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

const PAGE_SIZES = [10, 25, 50] as const;

// ─── Modal overlay base ───────────────────────────────────────────────────────

function Overlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Modal creación/edición ───────────────────────────────────────────────────

interface EditingUser {
  userEcommerceId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  active: boolean;
}

function UserFormModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: EditingUser | null; // null = crear
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = editing !== null;
  const [email, setEmail] = useState(editing?.email ?? '');
  const [firstName, setFirstName] = useState(editing?.firstName ?? '');
  const [lastName, setLastName] = useState(editing?.lastName ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [active, setActive] = useState(editing?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit && editing) {
        const body: UpdateUserEcommerceRequest = {
          email: email.trim() || undefined,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          phone: phone.trim() || null,
          active,
        };
        await api.usersEcommerce.update(editing.userEcommerceId, body);
      } else {
        const body: CreateUserEcommerceRequest = {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
          active,
        };
        await api.usersEcommerce.create(body);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay title={isEdit ? 'Editar usuario ecommerce' : 'Nuevo usuario ecommerce'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="ue-email">Email *</label>
          <input
            id="ue-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="usuario@ejemplo.com"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="ue-first">Nombre *</label>
            <input
              id="ue-first"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              placeholder="Carlos"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ue-last">Apellido *</label>
            <input
              id="ue-last"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              placeholder="Garcia Cano"
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="ue-phone">Telefono</label>
          <input
            id="ue-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="925234517"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="ue-active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="ue-active" className="text-sm text-slate-700 dark:text-slate-300">
            Activo
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Overlay>
  );
}

// ─── Modal de eliminación ─────────────────────────────────────────────────────

function DeleteModal({
  user,
  onClose,
  onDeleted,
}: {
  user: UserEcommerce;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await api.usersEcommerce.delete(user.userEcommerceId);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Overlay title="Eliminar usuario" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ¿Eliminar a{' '}
          <strong>
            {user.firstName} {user.lastName}
          </strong>{' '}
          ({user.email})?
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Si el usuario tiene ventas asociadas la operacion se rechazara con 409.
          En ese caso desactivalo con el boton de edicion.
        </p>
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function UsuariosEcommercePage() {
  // Filtros draft / aplicados
  const [draftEmail, setDraftEmail] = useState('');
  const [draftFirstName, setDraftFirstName] = useState('');
  const [draftLastName, setDraftLastName] = useState('');
  const [draftActive, setDraftActive] = useState<'' | 'true' | 'false'>('');
  const [draftSortBy, setDraftSortBy] = useState<UserEcommerceSortBy>('lastName');
  const [draftSortDir, setDraftSortDir] = useState<SortDirection>('ASC');

  const [appliedEmail, setAppliedEmail] = useState('');
  const [appliedFirstName, setAppliedFirstName] = useState('');
  const [appliedLastName, setAppliedLastName] = useState('');
  const [appliedActive, setAppliedActive] = useState<'' | 'true' | 'false'>('');
  const [appliedSortBy, setAppliedSortBy] = useState<UserEcommerceSortBy>('lastName');
  const [appliedSortDir, setAppliedSortDir] = useState<SortDirection>('ASC');

  // Tabla
  const [data, setData] = useState<Paginated<UserEcommerce> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  // Modales
  const [formTarget, setFormTarget] = useState<EditingUser | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<UserEcommerce | null>(null);

  const refreshCounter = useRef(0);
  const [, forceRefresh] = useState(0);

  function refresh() {
    refreshCounter.current += 1;
    forceRefresh((n) => n + 1);
  }

  function applyFilters() {
    setAppliedEmail(draftEmail);
    setAppliedFirstName(draftFirstName);
    setAppliedLastName(draftLastName);
    setAppliedActive(draftActive);
    setAppliedSortBy(draftSortBy);
    setAppliedSortDir(draftSortDir);
    setPage(1);
  }

  function resetFilters() {
    const reset = () => {
      setDraftEmail(''); setAppliedEmail('');
      setDraftFirstName(''); setAppliedFirstName('');
      setDraftLastName(''); setAppliedLastName('');
      setDraftActive(''); setAppliedActive('');
      setDraftSortBy('lastName'); setAppliedSortBy('lastName');
      setDraftSortDir('ASC'); setAppliedSortDir('ASC');
      setPage(1);
    };
    reset();
  }

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setTableError(null);
    api.usersEcommerce
      .list(
        {
          email: appliedEmail || undefined,
          firstName: appliedFirstName || undefined,
          lastName: appliedLastName || undefined,
          active: appliedActive === '' ? undefined : appliedActive === 'true',
          sortBy: appliedSortBy,
          sortDirection: appliedSortDir,
          page,
          limit,
        },
        c.signal,
      )
      .then((res) => { if (!c.signal.aborted) setData(res); })
      .catch(() => {
        if (!c.signal.aborted) setTableError('No se pudo cargar la lista de usuarios.');
      })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [appliedEmail, appliedFirstName, appliedLastName, appliedActive, appliedSortBy, appliedSortDir, page, limit, refreshCounter.current]);

  function openCreate() { setFormTarget(null); }
  function openEdit(u: UserEcommerce) {
    setFormTarget({
      userEcommerceId: u.userEcommerceId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      active: u.userActive,
    });
  }

  const hasActiveFilters =
    appliedEmail !== '' || appliedFirstName !== '' || appliedLastName !== '' || appliedActive !== '';

  return (
    <>
      <PageHeader
        title="Usuarios ecommerce"
        subtitle="Clientes registrados en la tienda online"
        actions={
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" />
            Nuevo usuario
          </Button>
        }
      />

      {/* Panel de filtros */}
      <Card className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="text" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} className={inputClass} placeholder="carlos" />
          </div>
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" value={draftFirstName} onChange={(e) => setDraftFirstName(e.target.value)} className={inputClass} placeholder="Carlos" />
          </div>
          <div>
            <label className={labelClass}>Apellido</label>
            <input type="text" value={draftLastName} onChange={(e) => setDraftLastName(e.target.value)} className={inputClass} placeholder="Garcia" />
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select value={draftActive} onChange={(e) => setDraftActive(e.target.value as '' | 'true' | 'false')} className={inputClass}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Ordenar por</label>
            <select value={draftSortBy} onChange={(e) => setDraftSortBy(e.target.value as UserEcommerceSortBy)} className={inputClass}>
              <option value="lastName">Apellido</option>
              <option value="firstName">Nombre</option>
              <option value="email">Email</option>
              <option value="createdAt">Fecha de registro</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Direccion</label>
            <select value={draftSortDir} onChange={(e) => setDraftSortDir(e.target.value as SortDirection)} className={inputClass}>
              <option value="ASC">A → Z</option>
              <option value="DESC">Z → A</option>
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button onClick={applyFilters} className="flex-1 sm:flex-none">Buscar</Button>
            {hasActiveFilters && <Button variant="secondary" onClick={resetFilters}>Limpiar</Button>}
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Usuarios
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-normal text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                filtrado
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Filas:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value) as typeof limit); setPage(1); }}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left">Nombre</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Telefono</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-left">Registro</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tableError ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-red-500 dark:text-red-400">
                    {tableError}
                  </td>
                </tr>
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    {hasActiveFilters ? 'Ningun usuario coincide con los filtros.' : 'No hay usuarios registrados.'}
                  </td>
                </tr>
              ) : (
                data.items.map((u) => (
                  <tr key={u.userEcommerceId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                      {u.phone ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                          u.userActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                        )}
                      >
                        {u.userActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-400 dark:text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/usuarios-ecommerce/${u.userEcommerceId}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                          title="Ver historial"
                        >
                          <HistoryIcon className="size-4" />
                        </Link>
                        <button
                          onClick={() => openEdit(u)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                          title="Editar"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          title="Eliminar"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pagina {data.meta.page} de {data.meta.totalPages} · {data.meta.total} usuarios
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={!data.meta.hasPreviousPage}>
                Anterior
              </Button>
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={!data.meta.hasNextPage}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modales */}
      {formTarget !== undefined && (
        <UserFormModal
          editing={formTarget}
          onClose={() => setFormTarget(undefined)}
          onSaved={refresh}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={refresh}
        />
      )}
    </>
  );
}
