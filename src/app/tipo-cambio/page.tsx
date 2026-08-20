'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface ExchangeRate {
  rateId: string;
  currencyFrom: string;
  currencyTo: string;
  rate: string;
  rateBuy: string | null;
  rateSell: string | null;
  effectiveDate: string;
  source: string;
  createdBy: string | null;
  createdAt: string;
}

interface ConvertResult {
  from: string;
  to: string;
  amount: number;
  rate: string;
  rateBuy: string | null;
  rateSell: string | null;
  result: string;
  effectiveDate: string;
}

interface Page<T> { items: T[]; meta: { total: number; totalPages: number } }

const CURRENCIES = ['USD', 'PEN', 'EUR', 'BRL', 'CLP'];

function fmtRate(v: string | null | undefined) {
  if (!v) return '—';
  return Number(v).toFixed(4);
}

function NewRateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    currencyFrom: 'USD', currencyTo: 'PEN',
    rate: '', rateBuy: '', rateSell: '',
    effectiveDate: today, source: 'manual',
  });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!form.rate) return;
    setSaving(true);
    try {
      await http.post('/exchange-rates', {
        ...form,
        rate:     parseFloat(form.rate),
        rateBuy:  form.rateBuy  ? parseFloat(form.rateBuy)  : null,
        rateSell: form.rateSell ? parseFloat(form.rateSell) : null,
      });
      onDone();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Registrar Tipo de Cambio</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Moneda origen</label>
            <select className={inputClass} value={form.currencyFrom} onChange={(e) => f('currencyFrom', e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Moneda destino</label>
            <select className={inputClass} value={form.currencyTo} onChange={(e) => f('currencyTo', e.target.value)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>TC promedio *</label>
            <input type="number" step="0.000001" className={inputClass} value={form.rate} onChange={(e) => f('rate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Fecha vigencia</label>
            <input type="date" className={inputClass} value={form.effectiveDate} onChange={(e) => f('effectiveDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>TC compra</label>
            <input type="number" step="0.000001" className={inputClass} value={form.rateBuy} onChange={(e) => f('rateBuy', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>TC venta</label>
            <input type="number" step="0.000001" className={inputClass} value={form.rateSell} onChange={(e) => f('rateSell', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Fuente</label>
            <select className={inputClass} value={form.source} onChange={(e) => f('source', e.target.value)}>
              {['manual', 'SUNAT', 'SBS', 'BCR', 'otro'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.rate}>
            {saving ? 'Guardando...' : 'Registrar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function TipoCambioPage() {
  const [rates, setRates]         = useState<ExchangeRate[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [showNew, setShowNew]     = useState(false);

  const [convFrom,   setConvFrom]   = useState('USD');
  const [convTo,     setConvTo]     = useState('PEN');
  const [convAmount, setConvAmount] = useState('100');
  const [convResult, setConvResult] = useState<ConvertResult | null>(null);
  const [converting, setConverting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await http.get<Page<ExchangeRate>>('/exchange-rates', { limit: '50' });
      setRates(data.items);
      setTotal(data.meta.total);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function convert() {
    setConverting(true);
    try {
      const result = await http.get<ConvertResult>('/exchange-rates/convert', {
        amount: convAmount, from: convFrom, to: convTo,
      });
      setConvResult(result);
    } finally { setConverting(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tipo de Cambio"
        actions={<Button onClick={() => setShowNew(true)}>+ Registrar TC</Button>}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">Conversor de monedas</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Monto</label>
                <input type="number" className={inputClass} value={convAmount} onChange={(e) => setConvAmount(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>De</label>
                <select className={inputClass} value={convFrom} onChange={(e) => setConvFrom(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>A</label>
                <select className={inputClass} value={convTo} onChange={(e) => setConvTo(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <Button onClick={convert} disabled={converting}>
              {converting ? 'Convirtiendo...' : 'Convertir'}
            </Button>
            {convResult && (
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-4 mt-2">
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                  {convResult.result} {convResult.to}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  TC: {Number(convResult.rate).toFixed(4)} · Fecha: {convResult.effectiveDate}
                </p>
                {convResult.rateBuy && (
                  <p className="text-xs text-slate-400">
                    Compra: {Number(convResult.rateBuy).toFixed(4)} · Venta: {Number(convResult.rateSell ?? 0).toFixed(4)}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Últimos TC registrados</h3>
          {loading && <p className="text-sm text-slate-400">Cargando...</p>}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {rates.slice(0, 5).map((r) => (
              <div key={r.rateId} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {r.currencyFrom}/{r.currencyTo}
                </span>
                <span className="tabular-nums text-indigo-600 dark:text-indigo-400 font-bold">
                  {fmtRate(r.rate)}
                </span>
                <span className="text-slate-400 text-xs">{r.effectiveDate}</span>
                <span className="text-slate-400 text-xs">{r.source}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Par</th>
              <th className="px-4 py-3 text-right">TC Promedio</th>
              <th className="px-4 py-3 text-right">Compra</th>
              <th className="px-4 py-3 text-right">Venta</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Registrado por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rates.length === 0 && (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">Sin registros</td></tr>
            )}
            {rates.map((r) => (
              <tr key={r.rateId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                  {r.currencyFrom}/{r.currencyTo}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-indigo-600 dark:text-indigo-400 font-bold">
                  {fmtRate(r.rate)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-500">{fmtRate(r.rateBuy)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-500">{fmtRate(r.rateSell)}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.effectiveDate}</td>
                <td className="px-4 py-3 text-slate-500">{r.source}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{r.createdBy ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
          {total} registros
        </div>
      </div>

      {showNew && <NewRateModal onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); load(); }} />}
    </div>
  );
}
