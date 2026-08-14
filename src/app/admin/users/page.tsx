'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError, type Paginated, type RoleItem, type UpdateUserRequest, type UserItem } from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PencilIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { RoleGuard } from '@/components/role-guard';

const LIMIT = 15;

// ─── Edit modal ──────────────────────────────────────────────────────────────

function EditUserModal({
  user,
  roles,
  onClose,
  onSaved,
}: {
  user: UserItem;
  roles: RoleItem[];
  onClose: () => void;
  onSaved: (updated: UserItem) => void;
}) {
  const [name, setName] = useState(user.name);
  const [roleId, setRoleId] = useState(user.roleId);
  const [active, setActive] = useState(user.active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const patch: UpdateUserRequest = {};
    if (name.trim() !== user.name) patch.name = name.trim();
    if (roleId !== user.roleId) patch.roleId = roleId;
    if (active !== user.active) patch.active = active;
    if (Object.keys(patch).length === 0) { onClose(); return; }

    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const updated = await api.users.update(user.id, patch, abortRef.current.signal);
      onSaved(updated);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Error al guardar cambios.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Editar usuario</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <div>
            <label className={labelClass} htmlFor="eu-email">Correo electrónico</label>
            <input id="eu-email" type="email" className={cn(inputClass, 'bg-slate-50 dark:bg-zinc-800 cursor-not-allowed')} value={user.email} readOnly />
          </div>

          <div>
            <label className={labelClass} htmlFor="eu-name">Nombre</label>
            <input
              id="eu-name"
              type="text"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="eu-role">Rol</label>
            <select
              id="eu-role"
              className={inputClass}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="eu-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 rounded border-slate-300 accent-blue-500"
            />
            <label htmlFor="eu-active" className="text-sm text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
              Usuario activo
            </label>
          </div>

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<UserItem> | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserItem | null>(null);

  useEffect(() => {
    const c = new AbortController();
    api.roles.list(c.signal).then(setRoles).catch(() => {});
    return () => c.abort();
  }, []);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    api.users
      .list({ page, limit: LIMIT }, c.signal)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => c.abort();
  }, [page]);

  function roleName(roleId: string) {
    return roles.find((r) => r.id === roleId)?.name ?? roleId;
  }

  function handleSaved(updated: UserItem) {
    setData((prev) =>
      prev
        ? { ...prev, items: prev.items.map((u) => (u.id === updated.id ? updated : u)) }
        : prev,
    );
    setEditing(null);
  }

  const totalPages = data ? Math.ceil(data.meta.total / LIMIT) : 1;

  return (
    <RoleGuard allowedRoles={['administrador']}>
      <PageHeader title="Usuarios" subtitle="Gestión de cuentas de acceso al sistema" />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-zinc-800/60">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.items.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {roleName(u.roleId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            u.active
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400',
                          )}
                        >
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-zinc-400 tabular-nums">
                        {new Date(u.createdAt).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setEditing(u)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                          aria-label="Editar usuario"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!loading && data?.items.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-zinc-500">
              No hay usuarios registrados.
            </p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-zinc-800">
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Página {page} de {totalPages} · {data?.meta.total ?? 0} usuarios
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {editing && (
        <EditUserModal
          user={editing}
          roles={roles}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </RoleGuard>
  );
}
