'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface Lead {
  leadId: string;
  fullName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  estimatedValue: string;
  notes: string | null;
  assignedTo: string | null;
  createdAt: string;
}

interface Activity {
  activityId: string;
  leadId: string;
  type: string;
  subject: string;
  description: string | null;
  activityDate: string;
  completed: boolean;
  createdBy: string | null;
}

interface PipelineItem {
  status: string;
  count: number;
  totalValue: string;
}

const STATUS_LABELS: Record<string, string> = {
  new:       'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  proposal:  'Propuesta',
  won:       'Ganado',
  lost:      'Perdido',
};

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  qualified: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  proposal:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  won:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  lost:      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const ACT_ICONS: Record<string, string> = { call: '📞', email: '✉️', meeting: '🤝', note: '📝', task: '✅' };

function fmt(n: string | number) { return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`; }

function NewLeadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    fullName: '', company: '', email: '', phone: '', source: '',
    status: 'new', estimatedValue: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!form.fullName.trim()) return;
    setSaving(true);
    try {
      await http.post('/crm/leads', {
        ...form,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : 0,
      });
      onDone();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nuevo Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelClass}>Nombre completo *</label>
            <input className={inputClass} value={form.fullName} onChange={(e) => f('fullName', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Empresa</label>
            <input className={inputClass} value={form.company} onChange={(e) => f('company', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Fuente</label>
            <select className={inputClass} value={form.source} onChange={(e) => f('source', e.target.value)}>
              <option value="">—</option>
              {['web', 'referido', 'linkedin', 'feria', 'llamada', 'otro'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => f('email', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input className={inputClass} value={form.phone} onChange={(e) => f('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select className={inputClass} value={form.status} onChange={(e) => f('status', e.target.value)}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Valor estimado (S/)</label>
            <input type="number" className={inputClass} value={form.estimatedValue} onChange={(e) => f('estimatedValue', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Notas</label>
            <textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => f('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.fullName.trim()}>
            {saving ? 'Guardando...' : 'Crear Lead'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ActivityModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [form, setForm] = useState({ type: 'call', subject: '', description: '', activityDate: new Date().toISOString().slice(0, 16) });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    http.get<Activity[]>(`/crm/leads/${lead.leadId}/activities`).then(setActivities).catch(() => {});
  }, [lead.leadId]);

  async function addActivity() {
    if (!form.subject.trim()) return;
    setSaving(true);
    try {
      const act = await http.post<Activity>(`/crm/leads/${lead.leadId}/activities`, form);
      setActivities((p) => [act, ...p]);
      setForm({ type: 'call', subject: '', description: '', activityDate: new Date().toISOString().slice(0, 16) });
    } finally { setSaving(false); }
  }

  async function complete(actId: string) {
    await http.patch(`/crm/activities/${actId}/complete`, {});
    setActivities((p) => p.map((a) => a.activityId === actId ? { ...a, completed: true } : a));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{lead.fullName}</h2>
            <p className="text-sm text-slate-500">{lead.company ?? ''} · {fmt(lead.estimatedValue)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Nueva actividad</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tipo</label>
              <select className={inputClass} value={form.type} onChange={(e) => f('type', e.target.value)}>
                {['call', 'email', 'meeting', 'note', 'task'].map((t) => (
                  <option key={t} value={t}>{ACT_ICONS[t]} {t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha</label>
              <input type="datetime-local" className={inputClass} value={form.activityDate} onChange={(e) => f('activityDate', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Asunto</label>
              <input className={inputClass} value={form.subject} onChange={(e) => f('subject', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Descripción</label>
              <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => f('description', e.target.value)} />
            </div>
          </div>
          <Button onClick={addActivity} disabled={saving || !form.subject.trim()}>
            {saving ? 'Guardando...' : 'Registrar'}
          </Button>
        </div>

        <div className="space-y-2">
          {activities.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Sin actividades registradas</p>}
          {activities.map((a) => (
            <div key={a.activityId} className="flex items-start gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
              <span className="text-xl">{ACT_ICONS[a.type] ?? '📌'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${a.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{a.subject}</p>
                {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                <p className="text-xs text-slate-400 mt-1">{new Date(a.activityDate).toLocaleString('es-PE')}</p>
              </div>
              {!a.completed && (
                <button onClick={() => complete(a.activityId)} className="text-xs text-indigo-600 hover:underline shrink-0">Completar</button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function CrmPage() {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [pipeline, setPipeline]   = useState<PipelineItem[]>([]);
  const [status, setStatus]       = useState('');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [selected, setSelected]   = useState<Lead | null>(null);
  const [tab, setTab]             = useState<'list' | 'pipeline'>('pipeline');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([
        http.get<{ items: Lead[] }>('/crm/leads', { status, search }),
        http.get<PipelineItem[]>('/crm/pipeline'),
      ]);
      setLeads(l.items);
      setPipeline(p);
    } finally { setLoading(false); }
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  async function moveStatus(lead: Lead, newStatus: string) {
    await http.patch(`/crm/leads/${lead.leadId}`, { status: newStatus });
    setLeads((p) => p.map((l) => l.leadId === lead.leadId ? { ...l, status: newStatus } : l));
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="CRM"
        actions={
          <Button onClick={() => setShowNew(true)}>+ Nuevo Lead</Button>
        }
      />

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(['pipeline', 'list'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
              tab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
            {t === 'pipeline' ? 'Pipeline' : 'Lista'}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipeline.map((p) => (
            <Card key={p.status} className="p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{STATUS_LABELS[p.status]}</p>
              <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{p.count}</p>
              <p className="mt-1 text-xs text-slate-500">{fmt(p.totalValue)}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'list' && (
        <>
          <div className="flex flex-wrap gap-3">
            <select className={`${inputClass} w-40`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input
              className={`${inputClass} flex-1 min-w-48`}
              placeholder="Buscar por nombre, empresa o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading && <p className="text-sm text-slate-400">Cargando...</p>}

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Valor Est.</th>
                  <th className="px-4 py-3">Asignado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leads.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">Sin leads</td></tr>
                )}
                {leads.map((lead) => (
                  <tr key={lead.leadId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <button className="font-medium text-indigo-600 hover:underline text-left" onClick={() => setSelected(lead)}>
                        {lead.fullName}
                      </button>
                      {lead.email && <p className="text-xs text-slate-400">{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{lead.company ?? '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${STATUS_COLORS[lead.status]}`}
                        value={lead.status}
                        onChange={(e) => moveStatus(lead, e.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(lead.estimatedValue)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{lead.assignedTo ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-indigo-600 hover:underline" onClick={() => setSelected(lead)}>
                        Actividades
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); load(); }} />}
      {selected && <ActivityModal lead={selected} onClose={() => { setSelected(null); load(); }} />}
    </div>
  );
}
