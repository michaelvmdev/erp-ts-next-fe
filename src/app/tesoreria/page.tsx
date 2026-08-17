'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface TreasuryAccount {
  accountId: string;
  name: string;
  type: 'cash' | 'bank';
  currency: string;
  bankName: string | null;
  accountNumber: string | null;
  initialBalance: number;
  currentBalance: number;
}

interface Movement {
  movementId: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  reference: string | null;
  category: string | null;
  movementDate: string;
  createdAt: string;
}

interface MovementsPage {
  items: Movement[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface CashFlowRow { period: string; income: number; expense: number; net: number; }

const TYPE_COLORS = {
  income:   'text-emerald-600 dark:text-emerald-400',
  expense:  'text-red-600 dark:text-red-400',
  transfer: 'text-indigo-600 dark:text-indigo-400',
};
const TYPE_LABELS = { income: 'Ingreso', expense: 'Egreso', transfer: 'Transferencia' };

function fmt(n: number) { return `S/. ${n.toFixed(2)}`; }

function NewAccountModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: '', type: 'cash', currency: 'PEN', bankName: '', accountNumber: '', initialBalance: '' });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await http.post('/tesoreria/accounts', { ...form, initialBalance: parseFloat(form.initialBalance) || 0 });
      onDone(); onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">Nueva cuenta</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={(e) => void submit(e)} className="space-y-3 px-6 py-5">
          <div><label className={labelClass}>Nombre</label><input className={inputClass} value={form.name} onChange={(e) => f('name', e.target.value)} required /></div>
          <div><label className={labelClass}>Tipo</label>
            <select className={inputClass} value={form.type} onChange={(e) => f('type', e.target.value)}>
              <option value="cash">Caja (efectivo)</option>
              <option value="bank">Cuenta bancaria</option>
            </select>
          </div>
          {form.type === 'bank' && <>
            <div><label className={labelClass}>Banco</label><input className={inputClass} value={form.bankName} onChange={(e) => f('bankName', e.target.value)} /></div>
            <div><label className={labelClass}>N° cuenta</label><input className={inputClass} value={form.accountNumber} onChange={(e) => f('accountNumber', e.target.value)} /></div>
          </>}
          <div><label className={labelClass}>Saldo inicial (S/.)</label><input type="number" className={inputClass} value={form.initialBalance} onChange={(e) => f('initialBalance', e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Crear'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewMovementModal({ accounts, onClose, onDone }: { accounts: TreasuryAccount[]; onClose: () => void; onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ accountId: accounts[0]?.accountId ?? '', type: 'income', amount: '', description: '', reference: '', category: '', movementDate: today });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await http.post('/tesoreria/movements', { ...form, amount: parseFloat(form.amount) });
      onDone(); onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">Nuevo movimiento</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={(e) => void submit(e)} className="space-y-3 px-6 py-5">
          <div><label className={labelClass}>Cuenta</label>
            <select className={inputClass} value={form.accountId} onChange={(e) => f('accountId', e.target.value)}>
              {accounts.map((a) => <option key={a.accountId} value={a.accountId}>{a.name}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>Tipo</label>
            <select className={inputClass} value={form.type} onChange={(e) => f('type', e.target.value)}>
              <option value="income">Ingreso</option>
              <option value="expense">Egreso</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <div><label className={labelClass}>Monto (S/.)</label><input type="number" step="0.01" className={inputClass} value={form.amount} onChange={(e) => f('amount', e.target.value)} required /></div>
          <div><label className={labelClass}>Descripción</label><input className={inputClass} value={form.description} onChange={(e) => f('description', e.target.value)} required /></div>
          <div><label className={labelClass}>Referencia (opcional)</label><input className={inputClass} value={form.reference} onChange={(e) => f('reference', e.target.value)} /></div>
          <div><label className={labelClass}>Fecha</label><input type="date" className={inputClass} value={form.movementDate} onChange={(e) => f('movementDate', e.target.value)} required /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Registrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TesoreriaPage() {
  const [accounts,    setAccounts]    = useState<TreasuryAccount[]>([]);
  const [movements,   setMovements]   = useState<Movement[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [cashFlow,    setCashFlow]    = useState<CashFlowRow[]>([]);
  const [showAccount, setShowAccount] = useState(false);
  const [showMovement,setShowMovement]= useState(false);
  const [tab,         setTab]         = useState<'movements' | 'cashflow'>('movements');
  const year = new Date().getFullYear();

  const loadAccounts = useCallback(async () => {
    const res = await http.get<TreasuryAccount[]>('/tesoreria/accounts');
    setAccounts(res);
  }, []);

  const loadMovements = useCallback(async (p: number) => {
    const res = await http.get<MovementsPage>('/tesoreria/movements', { page: p, limit: 20 });
    setMovements(res.items);
    setTotal(res.meta.total);
    setTotalPages(res.meta.totalPages);
    setPage(p);
  }, []);

  const loadCashFlow = useCallback(async () => {
    const res = await http.get<CashFlowRow[]>('/tesoreria/cash-flow', { year });
    setCashFlow(res);
  }, [year]);

  useEffect(() => { void loadAccounts(); void loadMovements(1); void loadCashFlow(); }, [loadAccounts, loadMovements, loadCashFlow]);

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

  return (
    <>
      {showAccount  && <NewAccountModal  onClose={() => setShowAccount(false)}  onDone={() => void loadAccounts()} />}
      {showMovement && <NewMovementModal accounts={accounts} onClose={() => setShowMovement(false)} onDone={() => { void loadAccounts(); void loadMovements(1); }} />}

      <PageHeader
        title="Tesorería"
        subtitle="Cajas y cuentas bancarias"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowAccount(true)}>+ Cuenta</Button>
            <Button onClick={() => setShowMovement(true)}>+ Movimiento</Button>
          </div>
        }
      />

      {/* Account cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <Card key={a.accountId} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{a.type === 'cash' ? 'Caja' : a.bankName ?? 'Banco'}</p>
                <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">{a.name}</p>
                {a.accountNumber && <p className="font-mono text-xs text-slate-400">{a.accountNumber}</p>}
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{fmt(a.currentBalance)}</span>
            </div>
          </Card>
        ))}
        <Card className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900">
          <p className="font-semibold text-indigo-700 dark:text-indigo-300">Saldo total</p>
          <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{fmt(totalBalance)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(['movements', 'cashflow'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {t === 'movements' ? `Movimientos (${total})` : `Flujo de caja ${year}`}
          </button>
        ))}
      </div>

      {tab === 'movements' && (
        <>
          <Card className="overflow-hidden p-0">
            {movements.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">Sin movimientos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Descripción</th>
                      <th className="px-4 py-2 text-left">Tipo</th>
                      <th className="px-4 py-2 text-right">Monto</th>
                      <th className="px-4 py-2 text-left">Ref.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {movements.map((m) => (
                      <tr key={m.movementId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2 text-slate-500">{m.movementDate}</td>
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{m.description}</td>
                        <td className={`px-4 py-2 font-medium ${TYPE_COLORS[m.type]}`}>{TYPE_LABELS[m.type]}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${TYPE_COLORS[m.type]}`}>
                          {m.type === 'expense' ? '-' : '+'}{fmt(m.amount)}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-slate-400">{m.reference ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => void loadMovements(page - 1)}>← Anterior</Button>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => void loadMovements(page + 1)}>Siguiente →</Button>
            </div>
          )}
        </>
      )}

      {tab === 'cashflow' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-4 py-2 text-left">Período</th>
                  <th className="px-4 py-2 text-right">Ingresos</th>
                  <th className="px-4 py-2 text-right">Egresos</th>
                  <th className="px-4 py-2 text-right">Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashFlow.length === 0
                  ? <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-400">Sin datos para {year}.</td></tr>
                  : cashFlow.map((r) => (
                    <tr key={r.period} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2 font-mono">{r.period}</td>
                      <td className="px-4 py-2 text-right text-emerald-600">{fmt(r.income)}</td>
                      <td className="px-4 py-2 text-right text-red-600">{fmt(r.expense)}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${r.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(r.net)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
