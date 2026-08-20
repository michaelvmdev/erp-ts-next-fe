'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface RecurringInvoice {
  recurringId: string; clientId: string; description: string; frequency: string;
  nextBillingDate: string; lastBilledDate: string | null; subTotal: string; igv: string; total: string;
  status: string; notes: string | null;
  items?: { itemId: string; description: string; quantity: string; unitPrice: string; subtotal: string }[];
}

const FREQ_LABELS: Record<string, string> = {
  weekly:'Semanal', monthly:'Mensual', bimonthly:'Bimestral',
  quarterly:'Trimestral', semiannual:'Semestral', annual:'Anual',
};
const STATUS_COLORS: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  paused:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  cancelled:'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

function fmt(n: string | number) { return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`; }

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export default function FacturacionRecurrentePage() {
  const [invoices, setInvoices] = useState<RecurringInvoice[]>([]);
  const [due, setDue]           = useState<RecurringInvoice[]>([]);
  const [loading, setLoading]   = useState(false);
  const [billing, setBilling]   = useState<string | null>(null);
  const [showNew, setShowNew]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [billedMsg, setBilledMsg] = useState<string | null>(null);
  const [clients, setClients]   = useState<{ clientId: string; clientDescription: string }[]>([]);
  const [form, setForm] = useState({
    clientId: '', description: '', frequency: 'monthly',
    nextBillingDate: new Date().toISOString().slice(0, 10),
    subTotal: '', igv: '', total: '', notes: '',
  });
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, dueList] = await Promise.all([
        http.get<{ items: RecurringInvoice[] }>('/recurring-billing', {}),
        http.get<RecurringInvoice[]>('/recurring-billing/due-today'),
      ]);
      setInvoices(list.items); setDue(dueList);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    http.get<{ items: { clientId: string; clientDescription: string }[] }>('/clients', { limit: '200' })
      .then((d) => setClients(d.items)).catch(() => {});
  }, []);

  async function billNow(id: string) {
    setBilling(id);
    try {
      const result = await http.post<{ message: string; saleNumber: string; nextDate: string }>(`/recurring-billing/${id}/bill`, {});
      setBilledMsg(`✓ ${result.message} — ${result.saleNumber} · Próx: ${result.nextDate}`);
      load();
    } finally { setBilling(null); }
  }

  async function toggleStatus(inv: RecurringInvoice) {
    const status = inv.status === 'active' ? 'paused' : 'active';
    await http.patch(`/recurring-billing/${inv.recurringId}`, { status });
    load();
  }

  async function create() {
    if (!form.clientId || !form.description || !form.total) return;
    setSaving(true);
    try {
      await http.post('/recurring-billing', {
        ...form,
        subTotal: parseFloat(form.subTotal) || 0,
        igv:      parseFloat(form.igv) || 0,
        total:    parseFloat(form.total) || 0,
      });
      setShowNew(false); load();
    } finally { setSaving(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Facturación Recurrente" actions={<Button onClick={() => setShowNew(true)}>+ Nueva</Button>} />

      {billedMsg && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          {billedMsg}
          <button onClick={() => setBilledMsg(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {due.length > 0 && (
        <Card className="p-4 border-amber-200 dark:border-amber-800">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3">
            🔔 {due.length} factura(s) pendientes de emitir hoy
          </p>
          <div className="space-y-2">
            {due.map((inv) => (
              <div key={inv.recurringId} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-200">{inv.description}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{fmt(inv.total)}</span>
                  <Button onClick={() => billNow(inv.recurringId)} disabled={billing === inv.recurringId}>
                    {billing === inv.recurringId ? 'Facturando...' : 'Facturar ahora'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading && <p className="text-sm text-slate-400">Cargando...</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-left">Frecuencia</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Próx. emisión</th>
              <th className="px-4 py-3 text-left">Últ. emisión</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoices.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">Sin facturas recurrentes</td></tr>
            )}
            {invoices.map((inv) => {
              const days = daysUntil(inv.nextBillingDate);
              return (
                <tr key={inv.recurringId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{inv.description}</td>
                  <td className="px-4 py-3 text-slate-500">{FREQ_LABELS[inv.frequency]}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[inv.status]}`}>
                      {inv.status === 'active' ? 'Activo' : inv.status === 'paused' ? 'Pausado' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-indigo-600 dark:text-indigo-400">{fmt(inv.total)}</td>
                  <td className="px-4 py-3">
                    <span className={days <= 0 ? 'text-red-600 font-bold' : days <= 3 ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                      {inv.nextBillingDate} {days <= 0 ? '(vencida)' : days <= 3 ? `(en ${days}d)` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{inv.lastBilledDate ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {inv.status === 'active' && (
                        <button onClick={() => billNow(inv.recurringId)} disabled={billing === inv.recurringId}
                          className="text-xs text-indigo-600 hover:underline">
                          {billing === inv.recurringId ? '...' : 'Facturar'}
                        </button>
                      )}
                      <button onClick={() => toggleStatus(inv)} className="text-xs text-slate-400 hover:text-slate-600 hover:underline">
                        {inv.status === 'active' ? 'Pausar' : inv.status === 'paused' ? 'Activar' : ''}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nueva factura recurrente</h2>
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
              <div><label className={labelClass}>Descripción *</label><input className={inputClass} value={form.description} onChange={(e) => f('description', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Frecuencia</label>
                  <select className={inputClass} value={form.frequency} onChange={(e) => f('frequency', e.target.value)}>
                    {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div><label className={labelClass}>Primera emisión</label><input type="date" className={inputClass} value={form.nextBillingDate} onChange={(e) => f('nextBillingDate', e.target.value)} /></div>
                <div><label className={labelClass}>Base imponible</label><input type="number" className={inputClass} value={form.subTotal} onChange={(e) => f('subTotal', e.target.value)} /></div>
                <div><label className={labelClass}>IGV</label><input type="number" className={inputClass} value={form.igv} onChange={(e) => f('igv', e.target.value)} /></div>
              </div>
              <div><label className={labelClass}>Total *</label><input type="number" className={inputClass} value={form.total} onChange={(e) => f('total', e.target.value)} /></div>
              <div><label className={labelClass}>Notas</label><textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => f('notes', e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={create} disabled={saving || !form.clientId || !form.total}>Crear</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
