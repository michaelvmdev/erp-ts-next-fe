'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface Company {
  companyId: string; name: string; tradeName: string | null; ruc: string | null;
  address: string | null; phone: string | null; email: string | null; website: string | null;
  currency: string; igvRate: string; isDefault: boolean; legalRep: string | null;
  logo: string | null; createdAt: string;
}

const BLANK: Omit<Company, 'companyId' | 'isDefault' | 'createdAt'> = {
  name: '', tradeName: '', ruc: '', address: '', phone: '', email: '', website: '',
  currency: 'PEN', igvRate: '18', legalRep: '', logo: '',
};

export default function EmpresaPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState<Company | null>(null);
  const [showNew, setShowNew]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState<typeof BLANK>({ ...BLANK });
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try { setCompanies(await http.get<Company[]>('/companies')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(c: Company) {
    setSelected(c);
    setForm({
      name: c.name, tradeName: c.tradeName ?? '', ruc: c.ruc ?? '', address: c.address ?? '',
      phone: c.phone ?? '', email: c.email ?? '', website: c.website ?? '', currency: c.currency,
      igvRate: c.igvRate, legalRep: c.legalRep ?? '', logo: c.logo ?? '',
    });
  }

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, igvRate: parseFloat(form.igvRate) || 18 };
      if (selected) {
        await http.patch(`/companies/${selected.companyId}`, payload);
      } else {
        await http.post('/companies', payload);
      }
      setSelected(null); setShowNew(false); setForm({ ...BLANK }); load();
    } finally { setSaving(false); }
  }

  async function setDefault(id: string) {
    await http.patch(`/companies/${id}/set-default`, {});
    load();
  }

  const isOpen = selected !== null || showNew;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Empresas" subtitle="Perfil y configuración de empresa" actions={<Button onClick={() => { setSelected(null); setForm({ ...BLANK }); setShowNew(true); }}>+ Nueva empresa</Button>} />

      {loading && <p className="text-sm text-slate-400">Cargando...</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {companies.map((c) => (
          <Card key={c.companyId} className={`p-5 space-y-3 relative cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all ${c.isDefault ? 'ring-2 ring-indigo-500' : ''}`} onClick={() => openEdit(c)}>
            {c.isDefault && (
              <span className="absolute top-3 right-3 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">Principal</span>
            )}
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{c.name}</h3>
              {c.tradeName && <p className="text-xs text-slate-400 truncate">{c.tradeName}</p>}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {c.ruc && (
                <><dt className="text-slate-400">RUC</dt><dd className="font-mono text-slate-600 dark:text-slate-300">{c.ruc}</dd></>
              )}
              <><dt className="text-slate-400">Moneda</dt><dd className="text-slate-600 dark:text-slate-300">{c.currency}</dd></>
              <><dt className="text-slate-400">IGV</dt><dd className="text-slate-600 dark:text-slate-300">{c.igvRate}%</dd></>
              {c.email && (
                <><dt className="text-slate-400">Email</dt><dd className="text-slate-600 dark:text-slate-300 truncate">{c.email}</dd></>
              )}
            </dl>
            <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" onClick={() => openEdit(c)}>Editar</Button>
              {!c.isDefault && (
                <Button onClick={() => setDefault(c.companyId)}>Establecer como principal</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selected ? 'Editar empresa' : 'Nueva empresa'}</h2>
              <button onClick={() => { setSelected(null); setShowNew(false); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelClass}>Razón social *</label>
                <input className={inputClass} value={form.name} onChange={(e) => f('name', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Nombre comercial</label>
                <input className={inputClass} value={form.tradeName ?? ''} onChange={(e) => f('tradeName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>RUC</label>
                <input className={inputClass} value={form.ruc ?? ''} maxLength={11} onChange={(e) => f('ruc', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Representante legal</label>
                <input className={inputClass} value={form.legalRep ?? ''} onChange={(e) => f('legalRep', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Moneda</label>
                <select className={inputClass} value={form.currency} onChange={(e) => f('currency', e.target.value)}>
                  {['PEN', 'USD', 'EUR'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tasa IGV (%)</label>
                <input type="number" className={inputClass} value={form.igvRate} onChange={(e) => f('igvRate', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input className={inputClass} value={form.phone ?? ''} onChange={(e) => f('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={form.email ?? ''} onChange={(e) => f('email', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Sitio web</label>
                <input className={inputClass} value={form.website ?? ''} onChange={(e) => f('website', e.target.value)} placeholder="https://" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Dirección</label>
                <input className={inputClass} value={form.address ?? ''} onChange={(e) => f('address', e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setSelected(null); setShowNew(false); }}>Cancelar</Button>
              <Button onClick={save} disabled={saving || !form.name}>
                {saving ? 'Guardando...' : selected ? 'Guardar cambios' : 'Crear empresa'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
