'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface PortalUser {
  portalUserId: string; email: string; clientId: string; isActive: boolean;
  lastLoginAt: string | null; createdAt: string;
  client?: { clientDescription: string };
}

export default function PortalClientesPage() {
  const [users, setUsers]       = useState<PortalUser[]>([]);
  const [clients, setClients]   = useState<{ clientId: string; clientDescription: string }[]>([]);
  const [loading, setLoading]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({ email: '', password: '', clientId: '' });
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await http.get<PortalUser[]>('/portal/users')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    http.get<{ items: { clientId: string; clientDescription: string }[] }>('/clients', { limit: '200' })
      .then((d) => setClients(d.items)).catch(() => {});
  }, []);

  async function create() {
    if (!form.email || !form.password || !form.clientId) return;
    setSaving(true);
    try {
      await http.post('/portal/users', form);
      setShowNew(false); setForm({ email: '', password: '', clientId: '' }); load();
    } finally { setSaving(false); }
  }

  async function toggleActive(u: PortalUser) {
    await http.patch(`/portal/users/${u.portalUserId}`, { isActive: !u.isActive });
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Portal del Cliente"
        subtitle="Gestiona los accesos que los clientes usan para ver sus facturas y cotizaciones"
        actions={<Button onClick={() => setShowNew(true)}>+ Crear acceso</Button>}
      />

      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 text-sm text-indigo-700 dark:text-indigo-300">
        <strong>URL del portal:</strong> Los clientes ingresan por <code className="bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded">/portal/auth/login</code> con su email y contraseña.
        Pueden ver sus facturas en <code className="bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded">/portal/my/invoices</code> y cotizaciones en <code className="bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded">/portal/my/quotes</code>.
      </div>

      {loading && <p className="text-sm text-slate-400">Cargando...</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Último acceso</th>
              <th className="px-4 py-3 text-left">Creado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">Sin usuarios de portal</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.portalUserId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{u.email}</td>
                <td className="px-4 py-3 text-slate-500">
                  {u.client?.clientDescription ?? clients.find((c) => c.clientId === u.clientId)?.clientDescription ?? u.clientId}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('es-PE') : 'Nunca'}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(u.createdAt).toLocaleDateString('es-PE')}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(u)}
                    className={`text-xs hover:underline ${u.isActive ? 'text-red-500' : 'text-emerald-600'}`}>
                    {u.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Crear acceso al portal</h2>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid gap-3">
              <div>
                <label className={labelClass}>Cliente *</label>
                <select className={inputClass} value={form.clientId} onChange={(e) => f('clientId', e.target.value)}>
                  <option value="">Seleccionar cliente</option>
                  {clients.map((c) => <option key={c.clientId} value={c.clientId}>{c.clientDescription}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Email *</label><input type="email" className={inputClass} value={form.email} onChange={(e) => f('email', e.target.value)} /></div>
              <div><label className={labelClass}>Contraseña temporal *</label><input type="password" className={inputClass} value={form.password} onChange={(e) => f('password', e.target.value)} /></div>
            </div>
            <p className="text-xs text-slate-400">El cliente recibirá estas credenciales para acceder al portal de autogestión.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={create} disabled={saving || !form.email || !form.password || !form.clientId}>Crear acceso</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
