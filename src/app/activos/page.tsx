'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface FixedAsset {
  assetId: string;
  code: string;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  residualValue: number;
  usefulLifeYears: number;
  depreciationMethod: string;
  status: 'active' | 'disposed' | 'fully_depreciated';
  location: string | null;
  serialNumber: string | null;
}

interface AssetsPage {
  items: FixedAsset[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface Depreciation {
  depreciationId: string;
  period: string;
  amount: number;
  accumulated: number;
  bookValue: number;
}

const STATUS_STYLES: Record<string, string> = {
  active:             'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  disposed:           'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  fully_depreciated:  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', disposed: 'Dado de baja', fully_depreciated: 'Totalmente depreciado',
};
const CATEGORIES = ['maquinaria', 'vehiculo', 'muebles', 'equipo_computo', 'edificio', 'otros'];

function fmt(n: number) { return `S/. ${n.toFixed(2)}`; }

function CreateAssetModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    code: '', name: '', category: 'equipo_computo', acquisitionDate: today,
    acquisitionCost: '', residualValue: '0', usefulLifeYears: '5',
    depreciationMethod: 'linear', location: '', serialNumber: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await http.post('/activos-fijos', {
        ...form,
        acquisitionCost: parseFloat(form.acquisitionCost),
        residualValue:   parseFloat(form.residualValue),
        usefulLifeYears: parseInt(form.usefulLifeYears),
      });
      onDone(); onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">Registrar activo fijo</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={(e) => void submit(e)} className="grid grid-cols-2 gap-3 px-6 py-5">
          <div><label className={labelClass}>Código</label><input className={inputClass} value={form.code} onChange={(e) => f('code', e.target.value)} required /></div>
          <div><label className={labelClass}>Categoría</label>
            <select className={inputClass} value={form.category} onChange={(e) => f('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className={labelClass}>Nombre</label><input className={inputClass} value={form.name} onChange={(e) => f('name', e.target.value)} required /></div>
          <div><label className={labelClass}>Fecha adquisición</label><input type="date" className={inputClass} value={form.acquisitionDate} onChange={(e) => f('acquisitionDate', e.target.value)} required /></div>
          <div><label className={labelClass}>Costo (S/.)</label><input type="number" step="0.01" className={inputClass} value={form.acquisitionCost} onChange={(e) => f('acquisitionCost', e.target.value)} required /></div>
          <div><label className={labelClass}>Valor residual (S/.)</label><input type="number" step="0.01" className={inputClass} value={form.residualValue} onChange={(e) => f('residualValue', e.target.value)} /></div>
          <div><label className={labelClass}>Vida útil (años)</label><input type="number" className={inputClass} value={form.usefulLifeYears} onChange={(e) => f('usefulLifeYears', e.target.value)} required /></div>
          <div><label className={labelClass}>Método depreciación</label>
            <select className={inputClass} value={form.depreciationMethod} onChange={(e) => f('depreciationMethod', e.target.value)}>
              <option value="linear">Lineal</option>
              <option value="accelerated">Acelerado</option>
            </select>
          </div>
          <div><label className={labelClass}>Ubicación</label><input className={inputClass} value={form.location} onChange={(e) => f('location', e.target.value)} /></div>
          <div><label className={labelClass}>N° serie</label><input className={inputClass} value={form.serialNumber} onChange={(e) => f('serialNumber', e.target.value)} /></div>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Registrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssetDetailModal({ asset, onClose, onDisposed }: { asset: FixedAsset; onClose: () => void; onDisposed: () => void }) {
  const [depreciations, setDepreciations] = useState<Depreciation[]>([]);
  const [disposing, setDisposing] = useState(false);

  useEffect(() => {
    void http.get<Depreciation[]>(`/activos-fijos/${asset.assetId}/depreciation`).then(setDepreciations);
  }, [asset.assetId]);

  async function dispose() {
    if (!confirm('¿Dar de baja este activo?')) return;
    setDisposing(true);
    try { await http.patch(`/activos-fijos/${asset.assetId}/dispose`, {}); onDisposed(); onClose(); }
    finally { setDisposing(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">{asset.code} — {asset.name}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Costo:</span> <strong>{fmt(asset.acquisitionCost)}</strong></div>
            <div><span className="text-slate-400">V. residual:</span> <strong>{fmt(asset.residualValue)}</strong></div>
            <div><span className="text-slate-400">Vida útil:</span> <strong>{asset.usefulLifeYears} años</strong></div>
            <div><span className="text-slate-400">Método:</span> <strong>{asset.depreciationMethod === 'linear' ? 'Lineal' : 'Acelerado'}</strong></div>
            <div><span className="text-slate-400">Depr. mensual:</span> <strong>{fmt((asset.acquisitionCost - asset.residualValue) / (asset.usefulLifeYears * 12))}</strong></div>
            <div><span className="text-slate-400">Estado:</span> <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[asset.status]}`}>{STATUS_LABELS[asset.status]}</span></div>
          </div>

          <h3 className="font-semibold text-slate-900 dark:text-white">Historial de depreciación</h3>
          {depreciations.length === 0
            ? <p className="text-sm text-slate-400">Sin depreciaciones registradas aún.</p>
            : <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500">
                  <th className="px-3 py-2 text-left">Período</th>
                  <th className="px-3 py-2 text-right">Dep. mes</th>
                  <th className="px-3 py-2 text-right">Acumulada</th>
                  <th className="px-3 py-2 text-right">Valor en libros</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {depreciations.map((d) => (
                    <tr key={d.depreciationId}>
                      <td className="px-3 py-1.5 font-mono">{d.period}</td>
                      <td className="px-3 py-1.5 text-right">{fmt(d.amount)}</td>
                      <td className="px-3 py-1.5 text-right">{fmt(d.accumulated)}</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{fmt(d.bookValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }

          {asset.status === 'active' && (
            <div className="flex justify-end">
              <Button variant="danger" onClick={() => void dispose()} disabled={disposing}>
                {disposing ? 'Procesando…' : 'Dar de baja'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActivosPage() {
  const [items,    setItems]    = useState<FixedAsset[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status,   setStatus]   = useState('active');
  const [loading,  setLoading]  = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<FixedAsset | null>(null);
  const [running,  setRunning]  = useState(false);

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await http.get<AssetsPage>('/activos-fijos', { status: s || undefined, page: p, limit: 20 });
      setItems(res.items); setTotal(res.meta.total); setTotalPages(res.meta.totalPages); setPage(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(1, status); }, [load, status]);

  async function runDepreciation() {
    const period = prompt('Período (YYYY-MM):', new Date().toISOString().slice(0, 7));
    if (!period) return;
    setRunning(true);
    try {
      const r = await http.post<{ processed: number; skipped: number }>('/activos-fijos/depreciation/run', { period });
      alert(`Período ${period}: ${r.processed} procesados, ${r.skipped} omitidos.`);
      void load(page, status);
    } finally { setRunning(false); }
  }

  return (
    <>
      {showCreate && <CreateAssetModal onClose={() => setShowCreate(false)} onDone={() => void load(1, status)} />}
      {selected   && <AssetDetailModal asset={selected} onClose={() => setSelected(null)} onDisposed={() => void load(1, status)} />}

      <PageHeader
        title="Activos Fijos"
        subtitle={`${total} activos registrados`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void runDepreciation()} disabled={running}>
              {running ? 'Calculando…' : '▶ Depreciar período'}
            </Button>
            <Button onClick={() => setShowCreate(true)}>+ Nuevo activo</Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        {(['active', 'disposed', 'fully_depreciated', ''] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {s === '' ? 'Todos' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? <p className="py-12 text-center text-sm text-slate-400">Cargando…</p>
          : items.length === 0 ? <p className="py-12 text-center text-sm text-slate-400">No hay activos.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="px-4 py-2 text-left">Código</th>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Categoría</th>
                    <th className="px-4 py-2 text-right">Costo</th>
                    <th className="px-4 py-2 text-center">Vida útil</th>
                    <th className="px-4 py-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((a) => (
                    <tr key={a.assetId} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30" onClick={() => setSelected(a)}>
                      <td className="px-4 py-2 font-mono text-indigo-600 dark:text-indigo-400">{a.code}</td>
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{a.name}</td>
                      <td className="px-4 py-2 text-slate-500">{a.category}</td>
                      <td className="px-4 py-2 text-right">{fmt(a.acquisitionCost)}</td>
                      <td className="px-4 py-2 text-center">{a.usefulLifeYears} años</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1, status)}>← Anterior</Button>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1, status)}>Siguiente →</Button>
        </div>
      )}
    </>
  );
}
