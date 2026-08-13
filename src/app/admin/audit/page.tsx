'use client';

import { Fragment, useEffect, useState } from 'react';
import { api, type AuditAction, type AuditEntry, type AuditListQuery } from '@/lib/api';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { cn } from '@/lib/cn';

const ACTION_COLOR: Record<AuditAction, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

const PAGE_SIZES = [20, 50, 100] as const;

function fmtDate(d: string) {
  return new Date(d).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditListQuery>({});
  const [draft, setDraft] = useState<AuditListQuery>({});
  const [data, setData] = useState<{ items: AuditEntry[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<(typeof PAGE_SIZES)[number]>(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    api.audit
      .list({ ...filters, page, limit }, c.signal)
      .then((res) => { setData(res); })
      .catch(() => { if (!c.signal.aborted) setError('No se pudo cargar el log.'); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [filters, page, limit]);

  function applyFilters() {
    setFilters(draft);
    setPage(1);
  }

  function clearFilters() {
    setDraft({});
    setFilters({});
    setPage(1);
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <>
      <PageHeader
        title="Auditoría de cambios"
        subtitle="Registro de acciones CREATE / UPDATE / DELETE sobre entidades del sistema."
      />

      {/* Filtros */}
      <Card className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Entidad</label>
            <input
              type="text"
              value={draft.entityType ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, entityType: e.target.value || undefined }))}
              className={inputClass}
              placeholder="product, client…"
            />
          </div>
          <div>
            <label className={labelClass}>Acción</label>
            <select
              value={draft.action ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, action: (e.target.value || undefined) as AuditAction | undefined }))}
              className={inputClass}
            >
              <option value="">Todas</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Usuario</label>
            <input
              type="text"
              value={draft.changedBy ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, changedBy: e.target.value || undefined }))}
              className={inputClass}
              placeholder="admin"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} className="flex-1">Buscar</Button>
            <Button variant="secondary" onClick={clearFilters}>Limpiar</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Desde</label>
            <input
              type="datetime-local"
              value={draft.dateFrom ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value || undefined }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Hasta</label>
            <input
              type="datetime-local"
              value={draft.dateTo ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value || undefined }))}
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Entradas{' '}
            {data && (
              <span className="ml-1 font-normal text-slate-400">({data.total} total)</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filas:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value) as typeof limit); setPage(1); }}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <p className="px-5 py-8 text-center text-sm text-red-500">{error}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left">Fecha</th>
                <th className="px-5 py-3 text-left">Acción</th>
                <th className="px-5 py-3 text-left">Entidad</th>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Usuario</th>
                <th className="px-5 py-3 text-left">Payload</th>
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
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                    No hay entradas de auditoría.
                  </td>
                </tr>
              ) : (
                data.items.map((e) => (
                  <Fragment key={e.auditId}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 tabular-nums text-xs text-slate-500">{fmtDate(e.createdAt)}</td>
                      <td className="px-5 py-3">
                        <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-semibold', ACTION_COLOR[e.action])}>
                          {e.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{e.entityType}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">{e.entityId}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{e.changedBy}</td>
                      <td className="px-5 py-3">
                        {e.payload ? (
                          <button
                            onClick={() => setExpanded(expanded === e.auditId ? null : e.auditId)}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {expanded === e.auditId ? 'Ocultar' : 'Ver'}
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                    {expanded === e.auditId && !!e.payload && (
                      <tr className="bg-slate-50 dark:bg-slate-800/20">
                        <td colSpan={6} className="px-5 py-3">
                          <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            {JSON.stringify(e.payload, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Página {page} de {totalPages} · {data.total} entradas
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Anterior</Button>
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Siguiente</Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
