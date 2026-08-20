'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface Webhook {
  webhookId: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  createdAt: string;
}

const ALL_EVENTS = [
  'sale.created',
  'purchase.created',
  'purchase_order.created',
  'purchase_order.approved',
  'purchase_order.rejected',
  'payment.created',
  'credit_note.created',
  'stock.low',
];

const EMPTY_FORM = { url: '', events: [] as string[], secret: '' };

function EventCheckbox({ event, checked, onChange }: { event: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded accent-indigo-600"
      />
      <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{event}</span>
    </label>
  );
}

function CreateWebhookModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function toggle(event: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      events: checked ? [...f.events, event] : f.events.filter((e) => e !== event),
    }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.url.trim()) { setError('La URL es requerida.'); return; }
    if (form.events.length === 0) { setError('Selecciona al menos un evento.'); return; }
    setSaving(true);
    setError(null);
    try {
      await http.post('/webhooks', {
        url:    form.url.trim(),
        events: form.events,
        secret: form.secret.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch {
      setError('Error al crear webhook.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Nuevo webhook</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>
        <form onSubmit={(e) => void submit(e)} className="space-y-4 px-6 py-5">
          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">URL *</label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://ejemplo.com/webhook"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Eventos *</label>
            <div className="grid grid-cols-2 gap-0.5">
              {ALL_EVENTS.map((ev) => (
                <EventCheckbox
                  key={ev}
                  event={ev}
                  checked={form.events.includes(ev)}
                  onChange={(v) => toggle(ev, v)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Secret (opcional)</label>
            <input
              type="text"
              className={inputClass}
              placeholder="clave para validar firma HMAC"
              value={form.secret}
              onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-400">
              Si se configura, se envía la cabecera <span className="font-mono">X-ERP-Signature: sha256=…</span>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Crear webhook'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WebhooksPage() {
  const [items,    setItems]    = useState<Webhook[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<Webhook[]>('/webhooks');
      setItems(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function del(id: string) {
    if (!confirm('¿Desactivar este webhook?')) return;
    setDeleting(id);
    try {
      await http.delete(`/webhooks/${id}`);
      setItems((prev) => prev.filter((w) => w.webhookId !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      {showCreate && (
        <CreateWebhookModal
          onClose={() => setShowCreate(false)}
          onCreated={() => void load()}
        />
      )}

      <PageHeader
        title="Webhooks"
        subtitle={`${items.length} webhook${items.length !== 1 ? 's' : ''} activos`}
        actions={<Button onClick={() => setShowCreate(true)}>+ Nuevo webhook</Button>}
      />

      <Card className="overflow-hidden p-0">
        {loading && items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">
            No hay webhooks. Crea uno para recibir eventos del sistema en tu servidor.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((wh) => (
              <li key={wh.webhookId} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                      <p className="truncate font-mono text-sm font-medium text-slate-900 dark:text-white">{wh.url}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {wh.events.map((ev) => (
                        <span
                          key={ev}
                          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                    {wh.secret && (
                      <p className="mt-1 text-xs text-slate-400">Firma HMAC activa</p>
                    )}
                  </div>
                  <button
                    onClick={() => void del(wh.webhookId)}
                    disabled={deleting === wh.webhookId}
                    className="flex-shrink-0 rounded-lg px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    {deleting === wh.webhookId ? '…' : 'Desactivar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
