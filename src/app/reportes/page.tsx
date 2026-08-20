'use client';

import { useState } from 'react';
import { api, type Pdt621Report } from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

function fmtMoney(v: string | number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2 });
}

function PdtCard({ title, data }: { title: string; data: { baseImponible: string; igv: string; total: string; count: number } }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <dl className="space-y-2">
        <div className="flex justify-between text-sm">
          <dt className="text-slate-500">Base imponible</dt>
          <dd className="tabular-nums font-semibold text-slate-800 dark:text-slate-100">S/ {fmtMoney(data.baseImponible)}</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-slate-500">IGV (18%)</dt>
          <dd className="tabular-nums font-semibold text-slate-800 dark:text-slate-100">S/ {fmtMoney(data.igv)}</dd>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
          <dt className="font-semibold text-slate-700 dark:text-slate-200">Total</dt>
          <dd className="tabular-nums font-bold text-slate-900 dark:text-white">S/ {fmtMoney(data.total)}</dd>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <dt>Comprobantes</dt>
          <dd>{data.count}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function ReportesPage() {
  const [period, setPeriod]   = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [report, setReport]   = useState<Pdt621Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function loadPdt() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.reports.pdt621(period);
      setReport(data);
    } catch {
      setError('No se pudo obtener el reporte PDT 621.');
    } finally {
      setLoading(false);
    }
  }

  const backendBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  return (
    <>
      <PageHeader
        title="Reportes Tributarios"
        subtitle="PDT 621 y libros electrónicos PLE para SUNAT."
      />

      <div className="space-y-8">
        {/* PDT 621 */}
        <Card className="p-5">
          <h2 className="mb-1 text-base font-bold text-slate-900 dark:text-white">PDT 621 — IGV / Renta mensual</h2>
          <p className="mb-4 text-sm text-slate-500">Resumen de ventas y compras del período para preparar la declaración mensual.</p>

          <div className="mb-4 flex items-end gap-3">
            <div>
              <label className={labelClass} htmlFor="pdt-period">Período</label>
              <input id="pdt-period" type="month" className={cn(inputClass, 'w-40')}
                value={period}
                onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <Button onClick={loadPdt} disabled={loading || !period}>
              {loading ? 'Consultando…' : 'Consultar'}
            </Button>
          </div>

          {error && (
            <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PdtCard title="Ventas" data={report.ventas} />
                <PdtCard title="Compras" data={report.compras} />
              </div>

              <div className={cn(
                'rounded-xl border p-5',
                report.igvDeterminado
                  ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
                  : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20',
              )}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {report.igvDeterminado ? 'IGV a pagar' : 'Saldo a favor'}
                </p>
                <p className={cn(
                  'text-2xl font-bold tabular-nums',
                  report.igvDeterminado
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400',
                )}>
                  S/ {fmtMoney(report.igvDeterminado ?? report.saldoAFavor)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  IGV ventas ({fmtMoney(report.ventas.igv)}) {report.igvDeterminado ? '−' : '<'} IGV compras ({fmtMoney(report.compras.igv)})
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* PLE */}
        <Card className="p-5">
          <h2 className="mb-1 text-base font-bold text-slate-900 dark:text-white">PLE — Libros Electrónicos</h2>
          <p className="mb-4 text-sm text-slate-500">Descarga los registros de ventas y compras en formato texto (pipe-delimited) conforme al Programa de Libros Electrónicos de SUNAT.</p>

          <div className="mb-4 flex items-end gap-3">
            <div>
              <label className={labelClass} htmlFor="ple-period">Período</label>
              <input id="ple-period" type="month" className={cn(inputClass, 'w-40')}
                value={period}
                onChange={(e) => setPeriod(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`${backendBase}${api.reports.downloadPleVentas(period)}`}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ↓ Registro de Ventas (14.1)
            </a>
            <a
              href={`${backendBase}${api.reports.downloadPleCompras(period)}`}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ↓ Registro de Compras (8.1)
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}
