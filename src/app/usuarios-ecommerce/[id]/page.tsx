'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, type UserEcommerce, type UserPurchaseHistoryItem } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

const NPS_LABEL: Record<NonNullable<UserPurchaseHistoryItem['npsCategory']>, string> = {
  promoter: 'Promotor',
  passive: 'Pasivo',
  detractor: 'Detractor',
};

const NPS_COLOR: Record<NonNullable<UserPurchaseHistoryItem['npsCategory']>, string> = {
  promoter: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  passive: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  detractor: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

const SALE_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  cancelled: 'Cancelada',
  overdue: 'Vencida',
};

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function fmtCurrency(v: string) {
  return `S/ ${parseFloat(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function UserPurchaseHistoryPage() {
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<UserEcommerce | null>(null);
  const [history, setHistory] = useState<UserPurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    Promise.all([
      api.usersEcommerce.get(id, c.signal),
      api.usersEcommerce.history(id, c.signal),
    ])
      .then(([u, h]) => {
        setUser(u);
        setHistory(h);
      })
      .catch(() => {
        if (!c.signal.aborted) setError('No se pudo cargar el historial.');
      })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [id]);

  const totalSpent = history.reduce((sum, h) => sum + parseFloat(h.total), 0);

  return (
    <>
      <PageHeader
        title={
          user
            ? `Historial de ${user.firstName} ${user.lastName}`
            : 'Historial de compras'
        }
        subtitle={user?.email ?? id}
        actions={
          <Link
            href="/usuarios-ecommerce"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ChevronLeftIcon className="size-4" />
            Volver
          </Link>
        }
      />

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Resumen */}
      {!loading && !error && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total compras
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {history.length}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Gasto total
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {fmtCurrency(totalSpent.toString())}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ticket promedio
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {history.length > 0 ? fmtCurrency((totalSpent / history.length).toString()) : '—'}
            </p>
          </Card>
        </div>
      )}

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Ventas
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left">Fecha</th>
                <th className="px-5 py-3 text-left">Documento</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-left">NPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    Este usuario no tiene compras registradas.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.saleId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                      {fmtDate(h.saleDate)}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-800 dark:text-slate-100">
                      {h.serie}-{h.number}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                      {fmtCurrency(h.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                        h.saleStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : h.saleStatus === 'cancelled'
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
                      )}>
                        {SALE_STATUS_LABEL[h.saleStatus] ?? h.saleStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {h.npsCategory ? (
                        <span className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                          NPS_COLOR[h.npsCategory],
                        )}>
                          {NPS_LABEL[h.npsCategory]} ({h.npsScore})
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
