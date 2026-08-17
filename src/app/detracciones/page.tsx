'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface DetractionCode {
  code: string;
  description: string;
  rate: number;
  ratePercent: string;
}

interface Detraccion {
  detraccionId: string;
  saleId: string;
  code: string;
  baseAmount: number;
  rate: number;
  amount: number;
  paymentDate: string | null;
  paymentNumber: string | null;
  status: 'pending' | 'paid' | 'exempt';
  createdAt: string;
}

interface DetraccionesPage {
  items: Detraccion[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const SPOT_THRESHOLD = 700;

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  exempt:  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};
const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', paid: 'Pagado', exempt: 'Exento' };

function fmt(n: number) { return `S/. ${n.toFixed(2)}`; }

function MarkPaidModal({
  detraccion,
  onClose,
  onDone,
}: { detraccion: Detraccion; onClose: () => void; onDone: () => void }) {
  const [paymentDate,   setPaymentDate]   = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paymentDate || !paymentNumber.trim()) { setError('Completa todos los campos.'); return; }
    setSaving(true);
    try {
      await http.patch(`/detracciones/${detraccion.detraccionId}/paid`, { paymentDate, paymentNumber });
      onDone();
      onClose();
    } catch { setError('Error al registrar pago.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Registrar pago SPOT</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={(e) => void submit(e)} className="space-y-4 px-6 py-5">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Monto a depositar: <strong className="text-slate-900 dark:text-white">{fmt(detraccion.amount)}</strong>
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className={labelClass}>Fecha de pago</label>
            <input type="date" className={inputClass} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>N° constancia SUNAT</label>
            <input type="text" className={inputClass} placeholder="Número de operación" value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Registrar pago'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DetraccionesPage() {
  const [codes,     setCodes]     = useState<DetractionCode[]>([]);
  const [items,     setItems]     = useState<Detraccion[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);
  const [status,    setStatus]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [markPaid,  setMarkPaid]  = useState<Detraccion | null>(null);

  // Calculator state
  const [calcAmount, setCalcAmount] = useState('');
  const [calcCode,   setCalcCode]   = useState('');
  const [calcResult, setCalcResult] = useState<{ applies: boolean; amount: number } | null>(null);

  useEffect(() => { void http.get<DetractionCode[]>('/detracciones/codes').then(setCodes); }, []);

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await http.get<DetraccionesPage>('/detracciones', { status: s || undefined, page: p, limit: 20 });
      setItems(res.items);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
      setPage(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(1, status); }, [load, status]);

  function calculate() {
    const amount = parseFloat(calcAmount);
    if (!calcCode || isNaN(amount)) return;
    const code = codes.find((c) => c.code === calcCode);
    if (!code) return;
    const applies = amount > SPOT_THRESHOLD;
    const det = applies ? Math.ceil(amount * code.rate * 100) / 100 : 0;
    setCalcResult({ applies, amount: det });
  }

  return (
    <>
      {markPaid && (
        <MarkPaidModal
          detraccion={markPaid}
          onClose={() => setMarkPaid(null)}
          onDone={() => void load(page, status)}
        />
      )}

      <PageHeader
        title="Detracciones SPOT"
        subtitle={`Sistema de Pago de Obligaciones Tributarias — umbral S/. ${SPOT_THRESHOLD}`}
      />

      {/* Calculator */}
      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Calculadora de detracción</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <label className={labelClass}>Importe venta (S/.)</label>
            <input type="number" className={inputClass} placeholder="0.00" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} />
          </div>
          <div className="min-w-[220px]">
            <label className={labelClass}>Código SPOT</label>
            <select className={inputClass} value={calcCode} onChange={(e) => setCalcCode(e.target.value)}>
              <option value="">Seleccionar…</option>
              {codes.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.description} ({c.ratePercent})</option>
              ))}
            </select>
          </div>
          <Button onClick={calculate}>Calcular</Button>
        </div>
        {calcResult && (
          <div className={`mt-4 rounded-xl px-5 py-4 ${calcResult.applies ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
            {calcResult.applies ? (
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Aplica detracción: <span className="text-xl">{fmt(calcResult.amount)}</span>
                <span className="ml-2 text-sm font-normal">a depositar en cuenta SUNAT antes del pago</span>
              </p>
            ) : (
              <p className="text-slate-500">No aplica detracción (importe ≤ S/. {SPOT_THRESHOLD})</p>
            )}
          </div>
        )}
      </Card>

      {/* Tasas vigentes */}
      <Card className="mb-6 overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Códigos SPOT vigentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-4 py-2 text-left">Código</th>
                <th className="px-4 py-2 text-left">Descripción</th>
                <th className="px-4 py-2 text-right">Tasa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {codes.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.code}</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{c.description}</td>
                  <td className="px-4 py-2 text-right font-semibold">{c.ratePercent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lista de detracciones */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Detracciones registradas ({total})</h2>
        <select className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" value={status} onChange={(e) => { setStatus(e.target.value); }}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagado</option>
          <option value="exempt">Exento</option>
        </select>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-400">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No hay detracciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-4 py-2 text-left">Código</th>
                  <th className="px-4 py-2 text-right">Base</th>
                  <th className="px-4 py-2 text-right">Tasa</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                  <th className="px-4 py-2 text-center">Estado</th>
                  <th className="px-4 py-2 text-left">N° Constancia</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((d) => (
                  <tr key={d.detraccionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2 font-mono text-indigo-600 dark:text-indigo-400">{d.code}</td>
                    <td className="px-4 py-2 text-right">{fmt(d.baseAmount)}</td>
                    <td className="px-4 py-2 text-right">{(d.rate * 100).toFixed(0)}%</td>
                    <td className="px-4 py-2 text-right font-semibold">{fmt(d.amount)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{d.paymentNumber ?? '—'}</td>
                    <td className="px-4 py-2">
                      {d.status === 'pending' && (
                        <button onClick={() => setMarkPaid(d)} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                          Registrar pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1, status)}>← Anterior</Button>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1, status)}>Siguiente →</Button>
          </div>
        </div>
      )}
    </>
  );
}
