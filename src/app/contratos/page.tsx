'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface Contract {
  contractId: string; contractNumber: string; title: string; type: string;
  clientId: string | null; supplierId: string | null; value: string; currency: string;
  startDate: string; endDate: string | null; renewalDate: string | null;
  status: string; autoRenew: boolean; alertDays: number;
  description: string | null; createdBy: string | null; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  active:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  expired:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  renewed:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};
const STATUS_LABELS: Record<string, string> = { draft:'Borrador', active:'Activo', expired:'Vencido', cancelled:'Cancelado', renewed:'Renovado' };
const TYPE_LABELS: Record<string, string> = { client:'Cliente', supplier:'Proveedor', other:'Otro' };

function fmt(n: string | number) { return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`; }

function daysUntil(date: string | null) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return diff;
}

export default function ContratosPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [expiring, setExpiring]   = useState<Contract[]>([]);
  const [loading, setLoading]     = useState(false);
  const [statusFilter, setStatus] = useState('');
  const [typeFilter, setType]     = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [selected, setSelected]   = useState<Contract | null>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'client', value: '', currency: 'PEN',
    startDate: new Date().toISOString().slice(0, 10), endDate: '', autoRenew: false, alertDays: '30', description: '',
  });
  const f = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, exp] = await Promise.all([
        http.get<{ items: Contract[] }>('/contracts', { status: statusFilter, type: typeFilter }),
        http.get<Contract[]>('/contracts/expiring-soon', { days: '45' }),
      ]);
      setContracts(list.items); setExpiring(exp);
    } finally { setLoading(false); }
  }, [statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await http.post('/contracts', {
        ...form, value: parseFloat(form.value) || 0, alertDays: parseInt(form.alertDays) || 30,
        endDate: form.endDate || null,
      });
      setShowNew(false); load();
    } finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    await http.patch(`/contracts/${id}`, { status });
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Contratos" actions={<Button onClick={() => setShowNew(true)}>+ Nuevo contrato</Button>} />

      {expiring.length > 0 && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">⚠ {expiring.length} contrato(s) por vencer en los próximos 45 días</p>
          <div className="flex flex-wrap gap-2">
            {expiring.map((c) => (
              <button key={c.contractId} onClick={() => setSelected(c)}
                className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors">
                {c.title} · {daysUntil(c.endDate)} días
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <select className={`${inputClass} w-40`} value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className={`${inputClass} w-40`} value={typeFilter} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading && <p className="text-sm text-slate-400">Cargando...</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">N°</th>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-left">Vence</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {contracts.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">Sin contratos</td></tr>
            )}
            {contracts.map((c) => {
              const days = daysUntil(c.endDate);
              return (
                <tr key={c.contractId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.contractNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{c.title}</td>
                  <td className="px-4 py-3 text-slate-500">{TYPE_LABELS[c.type]}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-700 dark:text-slate-200">{fmt(c.value)}</td>
                  <td className="px-4 py-3">
                    {c.endDate ? (
                      <span className={days !== null && days <= 30 ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                        {c.endDate}{days !== null && ` (${days}d)`}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {c.status === 'draft' && (
                      <button onClick={() => updateStatus(c.contractId, 'active')} className="text-xs text-emerald-600 hover:underline">Activar</button>
                    )}
                    {c.status === 'active' && (
                      <button onClick={() => updateStatus(c.contractId, 'cancelled')} className="text-xs text-red-500 hover:underline">Cancelar</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['N° contrato', selected.contractNumber],
                ['Tipo', TYPE_LABELS[selected.type]],
                ['Estado', STATUS_LABELS[selected.status]],
                ['Valor', fmt(selected.value)],
                ['Moneda', selected.currency],
                ['Inicio', selected.startDate],
                ['Fin', selected.endDate ?? '—'],
                ['Auto-renovar', selected.autoRenew ? 'Sí' : 'No'],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-xs text-slate-400">{k}</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-100">{v}</dd>
                </div>
              ))}
            </dl>
            {selected.description && <p className="text-sm text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">{selected.description}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelected(null)}>Cerrar</Button>
              {selected.status === 'active' && (
                <Button onClick={() => { updateStatus(selected.contractId, 'renewed'); setSelected(null); }}>Renovar</Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nuevo contrato</h2>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid gap-3">
              <div><label className={labelClass}>Título *</label><input className={inputClass} value={form.title} onChange={(e) => f('title', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Tipo</label>
                  <select className={inputClass} value={form.type} onChange={(e) => f('type', e.target.value)}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div><label className={labelClass}>Moneda</label>
                  <select className={inputClass} value={form.currency} onChange={(e) => f('currency', e.target.value)}>
                    {['PEN', 'USD', 'EUR'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className={labelClass}>Valor</label><input type="number" className={inputClass} value={form.value} onChange={(e) => f('value', e.target.value)} /></div>
                <div><label className={labelClass}>Alerta (días)</label><input type="number" className={inputClass} value={form.alertDays} onChange={(e) => f('alertDays', e.target.value)} /></div>
                <div><label className={labelClass}>Inicio</label><input type="date" className={inputClass} value={form.startDate} onChange={(e) => f('startDate', e.target.value)} /></div>
                <div><label className={labelClass}>Vencimiento</label><input type="date" className={inputClass} value={form.endDate} onChange={(e) => f('endDate', e.target.value)} /></div>
              </div>
              <div><label className={labelClass}>Descripción</label><textarea className={inputClass} rows={2} value={form.description} onChange={(e) => f('description', e.target.value)} /></div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={form.autoRenew as boolean} onChange={(e) => f('autoRenew', e.target.checked)} className="rounded" />
                Auto-renovar al vencimiento
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={create} disabled={saving || !form.title}>Crear</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
