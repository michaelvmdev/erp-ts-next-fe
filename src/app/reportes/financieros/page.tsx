'use client';

import { useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

function fmt(v: string | number | undefined | null) {
  if (v == null) return '—';
  return `S/ ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

interface EstadoResultados {
  periodo: string;
  ingresos: { ventasNetas: string; otrosIngresos: string; total: string };
  costos:   { costoVentas: string; gastosOperativos: string; total: string };
  resultados: { utilidadBruta: string; utilidadOperativa: string; utilidadNeta: string };
  fuente: string;
}

interface BalanceGeneral {
  fechaCorte: string;
  activo: {
    corriente: { efectivo: string; cuentasCobrar: string; inventarios: string; otros: string; subtotal: string };
    noCorriente: { activoFijo: string; intangibles: string; subtotal: string };
    total: string;
  };
  pasivo: {
    corriente: { cuentasPagar: string; tributosXPagar: string; otros: string; subtotal: string };
    noCorriente: { deudasLP: string; subtotal: string };
    total: string;
  };
  patrimonio: { capital: string; reservas: string; resultadoAcum: string; total: string };
  totalPasivoPatrimonio: string;
  cuadra: boolean;
  fuente: string;
}

function Row({ label, value, bold, indent, green, red }: {
  label: string; value: string; bold?: boolean; indent?: boolean; green?: boolean; red?: boolean;
}) {
  const num = Number(value);
  const colorClass = green
    ? 'text-emerald-600 dark:text-emerald-400'
    : red || num < 0
    ? 'text-red-600 dark:text-red-400'
    : 'text-slate-800 dark:text-slate-100';
  return (
    <div className={`flex justify-between py-1.5 text-sm ${indent ? 'pl-5' : ''} ${bold ? 'font-bold border-t border-slate-200 dark:border-slate-700 mt-1 pt-2' : ''}`}>
      <span className={bold ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'text-slate-900 dark:text-white text-base' : colorClass}`}>{fmt(value)}</span>
    </div>
  );
}

export default function ReportesFinancierosPage() {
  const now = new Date();
  const [tab, setTab]       = useState<'er' | 'bg'>('er');
  const [period, setPeriod] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [cutDate, setCutDate] = useState(now.toISOString().slice(0, 10));
  const [er, setEr]         = useState<EstadoResultados | null>(null);
  const [bg, setBg]         = useState<BalanceGeneral | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function loadEstadoResultados() {
    setLoading(true); setError(null);
    try {
      const data = await http.get<EstadoResultados>('/reports/estado-resultados', { period });
      setEr(data);
    } catch { setError('Error al cargar el Estado de Resultados'); }
    finally { setLoading(false); }
  }

  async function loadBalanceGeneral() {
    setLoading(true); setError(null);
    try {
      const data = await http.get<BalanceGeneral>('/reports/balance-general', { date: cutDate });
      setBg(data);
    } catch { setError('Error al cargar el Balance General'); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Reportes Financieros" />

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(['er', 'bg'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t === 'er' ? 'Estado de Resultados' : 'Balance General'}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {tab === 'er' && (
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div>
              <label className={labelClass}>Periodo</label>
              <input type="month" className={inputClass} value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <Button onClick={loadEstadoResultados} disabled={loading}>
              {loading ? 'Cargando...' : 'Generar'}
            </Button>
          </div>

          {er && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ingresos</h3>
                <Row label="Ventas netas"    value={er.ingresos.ventasNetas}   indent />
                <Row label="Otros ingresos"  value={er.ingresos.otrosIngresos} indent />
                <Row label="Total ingresos"  value={er.ingresos.total} bold green />
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Costos y Gastos</h3>
                <Row label="Costo de ventas"     value={er.costos.costoVentas}       indent red />
                <Row label="Gastos operativos"   value={er.costos.gastosOperativos}  indent red />
                <Row label="Total egresos"        value={er.costos.total} bold red />
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Resultados</h3>
                <Row label="Utilidad bruta"      value={er.resultados.utilidadBruta}     indent />
                <Row label="Utilidad operativa"  value={er.resultados.utilidadOperativa} indent />
                <Row label="Utilidad neta" value={er.resultados.utilidadNeta} bold
                  green={Number(er.resultados.utilidadNeta) >= 0}
                  red={Number(er.resultados.utilidadNeta) < 0}
                />
              </Card>

              <Card className="p-5 md:col-span-3">
                <p className="text-xs text-slate-400">
                  Periodo: <strong className="text-slate-600 dark:text-slate-300">{er.periodo}</strong>
                  {' · '}Fuente: <strong className="text-slate-600 dark:text-slate-300">{er.fuente}</strong>
                </p>
              </Card>
            </div>
          )}
        </div>
      )}

      {tab === 'bg' && (
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div>
              <label className={labelClass}>Fecha de corte</label>
              <input type="date" className={inputClass} value={cutDate} onChange={(e) => setCutDate(e.target.value)} />
            </div>
            <Button onClick={loadBalanceGeneral} disabled={loading}>
              {loading ? 'Cargando...' : 'Generar'}
            </Button>
          </div>

          {bg && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Activo</h3>
                <p className="text-xs font-semibold text-slate-400 mb-1">Corriente</p>
                <Row label="Efectivo y equiv."  value={bg.activo.corriente.efectivo}      indent />
                <Row label="Cuentas por cobrar" value={bg.activo.corriente.cuentasCobrar} indent />
                <Row label="Inventarios"        value={bg.activo.corriente.inventarios}   indent />
                <Row label="Otros activos cte." value={bg.activo.corriente.otros}         indent />
                <Row label="Activo corriente"   value={bg.activo.corriente.subtotal} bold />
                <p className="text-xs font-semibold text-slate-400 mb-1 mt-3">No Corriente</p>
                <Row label="Activo fijo"   value={bg.activo.noCorriente.activoFijo}  indent />
                <Row label="Intangibles"   value={bg.activo.noCorriente.intangibles} indent />
                <Row label="Activo no cte" value={bg.activo.noCorriente.subtotal} bold />
                <Row label="TOTAL ACTIVO"  value={bg.activo.total} bold green />
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Pasivo y Patrimonio</h3>
                <p className="text-xs font-semibold text-slate-400 mb-1">Pasivo Corriente</p>
                <Row label="Cuentas por pagar"  value={bg.pasivo.corriente.cuentasPagar}   indent />
                <Row label="Tributos por pagar" value={bg.pasivo.corriente.tributosXPagar} indent />
                <Row label="Otros pasivos cte." value={bg.pasivo.corriente.otros}          indent />
                <Row label="Pasivo corriente"   value={bg.pasivo.corriente.subtotal} bold />
                <p className="text-xs font-semibold text-slate-400 mb-1 mt-3">Pasivo No Corriente</p>
                <Row label="Deudas L/P"        value={bg.pasivo.noCorriente.deudasLP}   indent />
                <Row label="Pasivo no cte"     value={bg.pasivo.noCorriente.subtotal} bold />
                <Row label="TOTAL PASIVO"      value={bg.pasivo.total} bold red />
                <p className="text-xs font-semibold text-slate-400 mb-1 mt-3">Patrimonio</p>
                <Row label="Capital"            value={bg.patrimonio.capital}        indent />
                <Row label="Reservas"           value={bg.patrimonio.reservas}       indent />
                <Row label="Resultado acum."    value={bg.patrimonio.resultadoAcum}  indent />
                <Row label="TOTAL PATRIMONIO"   value={bg.patrimonio.total} bold green />
                <Row label="PASIVO + PATRIMONIO" value={bg.totalPasivoPatrimonio} bold />
              </Card>

              <Card className="p-5 md:col-span-2">
                <p className="text-xs text-slate-400">
                  Fecha de corte: <strong className="text-slate-600 dark:text-slate-300">{bg.fechaCorte}</strong>
                  {' · '}Balance cuadra: <strong className={bg.cuadra ? 'text-emerald-600' : 'text-red-600'}>{bg.cuadra ? 'Sí ✓' : 'No ✗'}</strong>
                  {' · '}Fuente: <strong className="text-slate-600 dark:text-slate-300">{bg.fuente}</strong>
                </p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
