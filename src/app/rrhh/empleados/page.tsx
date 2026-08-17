'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface Employee {
  employeeId: string;
  code: string;
  fullName: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string | null;
  position: string;
  department: string | null;
  hireDate: string;
  salary: number;
  pensionSystem: string;
  afpName: string | null;
  active: boolean;
}

interface EmpPage {
  items: Employee[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function fmt(n: number) { return `S/. ${n.toFixed(2)}`; }

function CreateEmployeeModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    code: '', firstName: '', lastName: '', documentNumber: '', email: '',
    position: '', department: '', hireDate: today, salary: '',
    pensionSystem: 'AFP', afpName: 'Integra',
  });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await http.post('/rrhh/employees', { ...form, salary: parseFloat(form.salary) });
      onDone(); onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">Nuevo empleado</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={(e) => void submit(e)} className="grid grid-cols-2 gap-3 px-6 py-5">
          <div><label className={labelClass}>Código</label><input className={inputClass} value={form.code} onChange={(e) => f('code', e.target.value)} required /></div>
          <div><label className={labelClass}>N° documento</label><input className={inputClass} value={form.documentNumber} onChange={(e) => f('documentNumber', e.target.value)} required /></div>
          <div><label className={labelClass}>Nombres</label><input className={inputClass} value={form.firstName} onChange={(e) => f('firstName', e.target.value)} required /></div>
          <div><label className={labelClass}>Apellidos</label><input className={inputClass} value={form.lastName} onChange={(e) => f('lastName', e.target.value)} required /></div>
          <div><label className={labelClass}>Cargo</label><input className={inputClass} value={form.position} onChange={(e) => f('position', e.target.value)} required /></div>
          <div><label className={labelClass}>Área / Dpto.</label><input className={inputClass} value={form.department} onChange={(e) => f('department', e.target.value)} /></div>
          <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={form.email} onChange={(e) => f('email', e.target.value)} /></div>
          <div><label className={labelClass}>Fecha ingreso</label><input type="date" className={inputClass} value={form.hireDate} onChange={(e) => f('hireDate', e.target.value)} required /></div>
          <div><label className={labelClass}>Sueldo (S/.)</label><input type="number" step="0.01" className={inputClass} value={form.salary} onChange={(e) => f('salary', e.target.value)} required /></div>
          <div><label className={labelClass}>Sistema previsional</label>
            <select className={inputClass} value={form.pensionSystem} onChange={(e) => f('pensionSystem', e.target.value)}>
              <option value="AFP">AFP</option>
              <option value="ONP">ONP</option>
            </select>
          </div>
          {form.pensionSystem === 'AFP' && (
            <div className="col-span-2"><label className={labelClass}>AFP</label>
              <select className={inputClass} value={form.afpName} onChange={(e) => f('afpName', e.target.value)}>
                {['Integra', 'Prima', 'Profuturo', 'Habitat'].map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          )}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Registrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmpleadosPage() {
  const [items,    setItems]    = useState<Employee[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [onlyActive, setOnlyActive] = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async (p: number, active: boolean) => {
    setLoading(true);
    try {
      const res = await http.get<EmpPage>('/rrhh/employees', { active: String(active), page: p, limit: 20 });
      setItems(res.items); setTotal(res.meta.total); setTotalPages(res.meta.totalPages); setPage(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(1, onlyActive); }, [load, onlyActive]);

  return (
    <>
      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} onDone={() => void load(1, onlyActive)} />}

      <PageHeader
        title="Empleados"
        subtitle={`${total} empleados`}
        actions={<Button onClick={() => setShowCreate(true)}>+ Nuevo empleado</Button>}
      />

      <div className="mb-4 flex gap-2">
        <button onClick={() => setOnlyActive(true)}  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${onlyActive  ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Activos</button>
        <button onClick={() => setOnlyActive(false)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${!onlyActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Cesados</button>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? <p className="py-12 text-center text-sm text-slate-400">Cargando…</p>
          : items.length === 0 ? <p className="py-12 text-center text-sm text-slate-400">No hay empleados.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="px-4 py-2 text-left">Código</th>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Cargo</th>
                    <th className="px-4 py-2 text-left">Área</th>
                    <th className="px-4 py-2 text-center">Previsional</th>
                    <th className="px-4 py-2 text-right">Sueldo</th>
                    <th className="px-4 py-2 text-left">Ingreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((e) => (
                    <tr key={e.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2 font-mono text-indigo-600 dark:text-indigo-400">{e.code}</td>
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{e.fullName}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{e.position}</td>
                      <td className="px-4 py-2 text-slate-500">{e.department ?? '—'}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold dark:bg-slate-800">
                          {e.pensionSystem}{e.afpName ? ` ${e.afpName}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">{fmt(e.salary)}</td>
                      <td className="px-4 py-2 text-slate-500">{e.hireDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1, onlyActive)}>← Anterior</Button>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1, onlyActive)}>Siguiente →</Button>
        </div>
      )}
    </>
  );
}
