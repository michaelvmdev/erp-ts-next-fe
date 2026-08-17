'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface Payroll {
  payrollId: string;
  period: string;
  status: 'draft' | 'approved' | 'paid';
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  approvedBy: string | null;
  approvedAt: string | null;
}

interface PayrollLine {
  lineId: string;
  employeeName: string;
  position: string;
  pensionSystem: string;
  basicSalary: number;
  familyAllowance: number;
  overtime: number;
  grossSalary: number;
  pensionDeduction: number;
  essalud: number;
  incomeTax: number;
  totalDeductions: number;
  netSalary: number;
  ctsProvision: number;
  gratificationProv: number;
}

interface PayrollsPage {
  items: Payroll[];
  meta: { page: number; total: number; totalPages: number };
}

const STATUS_STYLES: Record<string, string> = {
  draft:    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  paid:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
};
const STATUS_LABELS = { draft: 'Borrador', approved: 'Aprobada', paid: 'Pagada' };

function fmt(n: number) { return `S/. ${n.toFixed(2)}`; }

function PayrollDetailModal({ payroll, onClose, onApproved }: { payroll: Payroll; onClose: () => void; onApproved: () => void }) {
  const [lines,    setLines]    = useState<PayrollLine[]>([]);
  const [approving,setApproving]= useState(false);

  useEffect(() => {
    void http.get<PayrollLine[]>(`/rrhh/payrolls/${payroll.payrollId}/lines`).then(setLines);
  }, [payroll.payrollId]);

  async function approve() {
    setApproving(true);
    try { await http.patch(`/rrhh/payrolls/${payroll.payrollId}/approve`, {}); onApproved(); onClose(); }
    finally { setApproving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Planilla {payroll.period}</h2>
            <p className="text-sm text-slate-400">{lines.length} empleados</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[payroll.status]}`}>{STATUS_LABELS[payroll.status]}</span>
            {payroll.status === 'draft' && (
              <Button onClick={() => void approve()} disabled={approving}>{approving ? 'Aprobando…' : 'Aprobar planilla'}</Button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="mb-4 flex gap-6 text-sm">
            <div><span className="text-slate-400">Total bruto:</span> <strong>{fmt(payroll.totalGross)}</strong></div>
            <div><span className="text-slate-400">Descuentos:</span> <strong className="text-red-600">-{fmt(payroll.totalDeductions)}</strong></div>
            <div><span className="text-slate-400">Neto a pagar:</span> <strong className="text-emerald-600">{fmt(payroll.totalNet)}</strong></div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 font-semibold text-slate-500">
                  <th className="px-3 py-2 text-left">Empleado</th>
                  <th className="px-3 py-2 text-right">Básico</th>
                  <th className="px-3 py-2 text-right">Bruto</th>
                  <th className="px-3 py-2 text-right">AFP/ONP</th>
                  <th className="px-3 py-2 text-right">EsSalud</th>
                  <th className="px-3 py-2 text-right font-bold">Neto</th>
                  <th className="px-3 py-2 text-right">CTS prov.</th>
                  <th className="px-3 py-2 text-right">Grat. prov.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lines.map((l) => (
                  <tr key={l.lineId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-900 dark:text-white">{l.employeeName}</p>
                      <p className="text-slate-400">{l.position} · {l.pensionSystem}</p>
                    </td>
                    <td className="px-3 py-2 text-right">{fmt(l.basicSalary)}</td>
                    <td className="px-3 py-2 text-right">{fmt(l.grossSalary)}</td>
                    <td className="px-3 py-2 text-right text-red-600">-{fmt(l.pensionDeduction)}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{fmt(l.essalud)}</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-600">{fmt(l.netSalary)}</td>
                    <td className="px-3 py-2 text-right text-slate-400">{fmt(l.ctsProvision)}</td>
                    <td className="px-3 py-2 text-right text-slate-400">{fmt(l.gratificationProv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanillaPage() {
  const [items,    setItems]    = useState<Payroll[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<Payroll | null>(null);
  const [period,   setPeriod]   = useState(new Date().toISOString().slice(0, 7));

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await http.get<PayrollsPage>('/rrhh/payrolls', { page: p, limit: 12 });
      setItems(res.items); setTotal(res.meta.total); setTotalPages(res.meta.totalPages); setPage(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(1); }, [load]);

  async function generate() {
    if (!period) return;
    setGenerating(true);
    try {
      await http.post('/rrhh/payrolls', { period });
      void load(1);
    } catch (e) {
      alert((e as Error).message);
    } finally { setGenerating(false); }
  }

  return (
    <>
      {selected && <PayrollDetailModal payroll={selected} onClose={() => setSelected(null)} onApproved={() => void load(1)} />}

      <PageHeader
        title="Planilla"
        subtitle={`${total} planillas registradas`}
        actions={
          <div className="flex items-end gap-2">
            <div>
              <input type="month" className={inputClass} value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <Button onClick={() => void generate()} disabled={generating}>
              {generating ? 'Generando…' : '▶ Generar planilla'}
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden p-0">
        {loading ? <p className="py-12 text-center text-sm text-slate-400">Cargando…</p>
          : items.length === 0 ? <p className="py-12 text-center text-sm text-slate-400">No hay planillas aún.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="px-4 py-2 text-left">Período</th>
                    <th className="px-4 py-2 text-center">Estado</th>
                    <th className="px-4 py-2 text-right">Bruto</th>
                    <th className="px-4 py-2 text-right">Descuentos</th>
                    <th className="px-4 py-2 text-right">Neto</th>
                    <th className="px-4 py-2 text-left">Aprobado por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((p) => (
                    <tr key={p.payrollId} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30" onClick={() => setSelected(p)}>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">{p.period}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                      </td>
                      <td className="px-4 py-3 text-right">{fmt(p.totalGross)}</td>
                      <td className="px-4 py-3 text-right text-red-600">-{fmt(p.totalDeductions)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmt(p.totalNet)}</td>
                      <td className="px-4 py-3 text-slate-500">{p.approvedBy ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1)}>← Anterior</Button>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Siguiente →</Button>
        </div>
      )}
    </>
  );
}
