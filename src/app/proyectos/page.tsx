'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface Project {
  projectId: string; projectName: string; clientId: string | null;
  description: string | null; budget: string; actualCost?: string;
  startDate: string | null; endDate: string | null; status: string; createdAt: string;
}
interface Task {
  taskId: string; projectId: string; title: string; assignee: string | null;
  estimatedHours: string; actualHours: string; status: string; dueDate: string | null;
}
interface Expense {
  expenseId: string; projectId: string; description: string;
  amount: string; category: string | null; expenseDate: string;
}

const STATUS_COLORS: Record<string, string> = {
  planning:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  active:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  on_hold:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
const STATUS_LABELS: Record<string, string> = { planning:'Planificación', active:'Activo', on_hold:'En espera', completed:'Completado', cancelled:'Cancelado' };
const TASK_STATUS: Record<string, string> = { todo:'Pendiente', in_progress:'En progreso', done:'Listo', cancelled:'Cancelado' };

function fmt(n: string | number) { return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`; }
function pct(actual: string, budget: string) {
  const b = Number(budget); if (!b) return 0;
  return Math.min(Math.round((Number(actual) / b) * 100), 100);
}

function ProjectModal({ project, onClose, onDone }: { project: Project; onClose: () => void; onDone: () => void }) {
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tab, setTab]         = useState<'tasks' | 'expenses'>('tasks');
  const [newTask, setNewTask] = useState({ title: '', assignee: '', estimatedHours: '', dueDate: '' });
  const [newExp, setNewExp]   = useState({ description: '', amount: '', category: '', expenseDate: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    http.get<Task[]>(`/projects/${project.projectId}/tasks`).then(setTasks).catch(() => {});
    http.get<Expense[]>(`/projects/${project.projectId}/expenses`).then(setExpenses).catch(() => {});
  }, [project.projectId]);

  const progress = pct(project.actualCost ?? '0', project.budget);

  async function addTask() {
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      const t = await http.post<Task>(`/projects/${project.projectId}/tasks`, { ...newTask, estimatedHours: parseFloat(newTask.estimatedHours) || 0 });
      setTasks((p) => [...p, t]);
      setNewTask({ title: '', assignee: '', estimatedHours: '', dueDate: '' });
    } finally { setSaving(false); }
  }

  async function moveTask(taskId: string, status: string) {
    await http.patch(`/projects/tasks/${taskId}`, { status });
    setTasks((p) => p.map((t) => t.taskId === taskId ? { ...t, status } : t));
  }

  async function addExpense() {
    if (!newExp.description.trim() || !newExp.amount) return;
    setSaving(true);
    try {
      const e = await http.post<Expense>(`/projects/${project.projectId}/expenses`, { ...newExp, amount: parseFloat(newExp.amount) });
      setExpenses((p) => [...p, e]);
      setNewExp({ description: '', amount: '', category: '', expenseDate: new Date().toISOString().slice(0, 10) });
      onDone();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{project.projectName}</h2>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[project.status]}`}>{STATUS_LABELS[project.status]}</span>
              {project.startDate && <span className="text-xs text-slate-400">{project.startDate} → {project.endDate ?? 'indefinido'}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-400">Presupuesto</p>
            <p className="font-bold text-slate-800 dark:text-slate-100">{fmt(project.budget)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-400">Gasto real</p>
            <p className={`font-bold ${progress > 90 ? 'text-red-600' : progress > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmt(project.actualCost ?? 0)} ({progress}%)</p>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
          <div className={`h-2 rounded-full transition-all ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }} />
        </div>

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {(['tasks', 'expenses'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              {t === 'tasks' ? `Tareas (${tasks.length})` : `Gastos (${expenses.length})`}
            </button>
          ))}
        </div>

        {tab === 'tasks' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <input className={`col-span-2 ${inputClass}`} placeholder="Título de tarea" value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} />
              <input className={inputClass} placeholder="Responsable" value={newTask.assignee} onChange={(e) => setNewTask((p) => ({ ...p, assignee: e.target.value }))} />
              <Button onClick={addTask} disabled={saving || !newTask.title}>+ Agregar</Button>
            </div>
            {tasks.map((t) => (
              <div key={t.taskId} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{TASK_STATUS[t.status]}</span>
                <p className={`flex-1 text-sm ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{t.title}</p>
                {t.assignee && <span className="text-xs text-slate-400">{t.assignee}</span>}
                {t.status !== 'done' && (
                  <select className="text-xs border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 bg-white dark:bg-slate-900"
                    value={t.status} onChange={(e) => moveTask(t.taskId, e.target.value)}>
                    <option value="todo">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="done">Listo</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'expenses' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <input className={`col-span-2 ${inputClass}`} placeholder="Descripción" value={newExp.description} onChange={(e) => setNewExp((p) => ({ ...p, description: e.target.value }))} />
              <input type="number" className={inputClass} placeholder="Monto" value={newExp.amount} onChange={(e) => setNewExp((p) => ({ ...p, amount: e.target.value }))} />
              <Button onClick={addExpense} disabled={saving || !newExp.description || !newExp.amount}>+ Agregar</Button>
            </div>
            {expenses.map((e) => (
              <div key={e.expenseId} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2 text-sm">
                <span className="flex-1 text-slate-700 dark:text-slate-200">{e.description}</span>
                {e.category && <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{e.category}</span>}
                <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">{fmt(e.amount)}</span>
                <span className="text-xs text-slate-400">{e.expenseDate}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(false);
  const [statusFilter, setStatus] = useState('');
  const [showNew, setShowNew]   = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [form, setForm] = useState({ projectName: '', description: '', budget: '', startDate: '', endDate: '', status: 'planning' });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await http.get<{ items: Project[] }>('/projects', { status: statusFilter });
      setProjects(data.items);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.projectName.trim()) return;
    setSaving(true);
    try {
      await http.post('/projects', { ...form, budget: parseFloat(form.budget) || 0 });
      setShowNew(false); setForm({ projectName: '', description: '', budget: '', startDate: '', endDate: '', status: 'planning' });
      load();
    } finally { setSaving(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Proyectos" actions={<Button onClick={() => setShowNew(true)}>+ Nuevo proyecto</Button>} />

      <div className="flex gap-3">
        <select className={`${inputClass} w-44`} value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading && <p className="text-sm text-slate-400">Cargando...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const progress = pct(p.actualCost ?? '0', p.budget);
          return (
            <Card key={p.projectId} className="p-5 space-y-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(p)}>
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">{p.projectName}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2 ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
              </div>
              {p.description && <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Presupuesto</span><span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(p.budget)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-1.5 rounded-full ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Gasto: {fmt(p.actualCost ?? 0)}</span><span>{progress}%</span>
                </div>
              </div>
              {(p.startDate || p.endDate) && (
                <p className="text-xs text-slate-400">{p.startDate ?? '—'} → {p.endDate ?? 'indefinido'}</p>
              )}
            </Card>
          );
        })}
        {!loading && projects.length === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400">Sin proyectos</div>
        )}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nuevo proyecto</h2>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid gap-3">
              <div><label className={labelClass}>Nombre *</label><input className={inputClass} value={form.projectName} onChange={(e) => f('projectName', e.target.value)} /></div>
              <div><label className={labelClass}>Descripción</label><textarea className={inputClass} rows={2} value={form.description} onChange={(e) => f('description', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Presupuesto (S/)</label><input type="number" className={inputClass} value={form.budget} onChange={(e) => f('budget', e.target.value)} /></div>
                <div><label className={labelClass}>Estado</label>
                  <select className={inputClass} value={form.status} onChange={(e) => f('status', e.target.value)}>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div><label className={labelClass}>Inicio</label><input type="date" className={inputClass} value={form.startDate} onChange={(e) => f('startDate', e.target.value)} /></div>
                <div><label className={labelClass}>Fin</label><input type="date" className={inputClass} value={form.endDate} onChange={(e) => f('endDate', e.target.value)} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={create} disabled={saving || !form.projectName}>Crear</Button>
            </div>
          </Card>
        </div>
      )}

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} onDone={load} />}
    </div>
  );
}
