'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader } from '@/components/ui';
import { http } from '@/lib/api/http';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsPage {
  items: Notification[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const TYPE_COLORS: Record<string, string> = {
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  error:   'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

function typeColor(t: string) {
  return TYPE_COLORS[t] ?? TYPE_COLORS['info'];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function NotificacionesPage() {
  const [items,       setItems]       = useState<Notification[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [pageRes, countRes] = await Promise.all([
        http.get<NotificationsPage>('/notifications', { page: p, limit: 20 }),
        http.get<{ count: number }>('/notifications/unread-count'),
      ]);
      setItems(pageRes.items);
      setTotal(pageRes.meta.total);
      setTotalPages(pageRes.meta.totalPages);
      setPage(p);
      setUnread(countRes.count);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1); }, [load]);

  async function markRead(id: string) {
    await http.patch(`/notifications/${id}/read`, {});
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnread((u) => Math.max(0, u - 1));
  }

  async function markAllRead() {
    await http.post('/notifications/read-all');
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  return (
    <>
      <PageHeader
        title="Notificaciones"
        subtitle={`${total} notificaciones · ${unread} sin leer`}
        actions={
          unread > 0
            ? <Button variant="secondary" onClick={() => void markAllRead()}>Marcar todas como leídas</Button>
            : undefined
        }
      />

      <Card className="p-0 overflow-hidden">
        {loading && items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">No hay notificaciones.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition ${n.read ? '' : 'bg-indigo-50/40 dark:bg-indigo-950/10'}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeColor(n.type)}`}>
                    {n.type}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => void markRead(n.id)}
                    className="flex-shrink-0 rounded-lg px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                  >
                    Leído
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">{total} notificaciones · página {page} de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1)}>
              ← Anterior
            </Button>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1)}>
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
