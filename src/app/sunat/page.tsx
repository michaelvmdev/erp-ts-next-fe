'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { ValidateDocResult } from '@/lib/api/sunat';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

// ─── Validación RUC / DNI ─────────────────────────────────────────────────────

function ValidateDocSection() {
  const [tab, setTab]     = useState<'ruc' | 'dni'>('ruc');
  const [numero, setNumero] = useState('');
  const [result, setResult] = useState<ValidateDocResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function validate() {
    if (!numero.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = tab === 'ruc'
        ? await api.sunat.validateRuc(numero.trim())
        : await api.sunat.validateDni(numero.trim());
      setResult(res);
    } catch {
      setResult({ numero, valid: false, reason: 'Error al conectar con el servidor.', source: 'local' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-1 text-base font-bold text-slate-900 dark:text-white">Validar documento</h2>
      <p className="mb-4 text-sm text-slate-500">Verifica el formato y dígito verificador del RUC o DNI.</p>

      <div className="mb-4 flex gap-2">
        {(['ruc', 'dni'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setResult(null); setNumero(''); }}
            className={cn(
              'rounded-full px-4 py-1 text-sm font-medium transition',
              tab === t
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300',
            )}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-3">
        <div>
          <label className={labelClass} htmlFor="doc-num">
            Número de {tab === 'ruc' ? 'RUC (11 dígitos)' : 'DNI (8 dígitos)'}
          </label>
          <input id="doc-num" type="text" className={cn(inputClass, 'w-48')}
            maxLength={tab === 'ruc' ? 11 : 8}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={tab === 'ruc' ? '20600897360' : '12345678'}
            value={numero}
            onChange={(e) => { setNumero(e.target.value.replace(/\D/g, '')); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && validate()}
          />
        </div>
        <Button onClick={validate} disabled={!numero.trim() || loading}>
          {loading ? 'Validando…' : 'Validar'}
        </Button>
      </div>

      {result && (
        <div className={cn(
          'mt-4 rounded-xl border p-4',
          result.valid
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20'
            : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20',
        )}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{result.valid ? '✅' : '❌'}</span>
            <div>
              <p className={cn('font-semibold', result.valid ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300')}>
                {result.valid ? 'Válido' : 'Inválido'}
              </p>
              {!result.valid && result.reason && (
                <p className="text-sm text-red-600 dark:text-red-400">{result.reason}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Facturación electrónica ─────────────────────────────────────────────────

function ElectronicInvoiceSection() {
  const [saleId, setSaleId] = useState('');
  const backendBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  return (
    <Card className="p-5">
      <h2 className="mb-1 text-base font-bold text-slate-900 dark:text-white">Facturación electrónica</h2>
      <p className="mb-2 text-sm text-slate-500">
        Genera el XML UBL 2.1 de una venta conforme al estándar SUNAT.
        Para habilitar la firma digital y el envío al OSE, configura las variables de entorno:
      </p>
      <pre className="mb-4 rounded-lg bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
{`SUNAT_RUC=20600897360
SUNAT_RAZON_SOCIAL=MI EMPRESA S.A.C.
SUNAT_CERT_PATH=/ruta/certificado.p12
SUNAT_CERT_PASSWORD=clave_del_certificado
SUNAT_OSE_URL=https://ose.example.com/send`}
      </pre>

      <div className="flex items-end gap-3">
        <div>
          <label className={labelClass} htmlFor="sale-id">ID de venta (UUID)</label>
          <input id="sale-id" type="text" className={cn(inputClass, 'w-80')}
            placeholder="550e8400-e29b-41d4-a716-446655440000"
            value={saleId}
            onChange={(e) => setSaleId(e.target.value.trim())}
          />
        </div>
        <a
          href={saleId ? `${backendBase}${api.sunat.invoiceXmlUrl(saleId)}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          download
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition',
            saleId
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
              : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:text-slate-600',
          )}
          onClick={(e) => !saleId && e.preventDefault()}
        >
          ↓ Descargar XML
        </a>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Proceso de emisión electrónica</h3>
        <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {[
            { step: '1', label: 'Generar XML UBL 2.1', status: 'done', note: 'Disponible arriba' },
            { step: '2', label: 'Firmar digitalmente', status: 'pending', note: 'Requiere certificado X.509 en SUNAT_CERT_PATH' },
            { step: '3', label: 'Enviar a OSE o SUNAT', status: 'pending', note: 'Requiere SUNAT_OSE_URL' },
            { step: '4', label: 'Recibir CDR (Constancia)', status: 'pending', note: 'Almacena el CDR en el registro de la venta' },
          ].map((item) => (
            <li key={item.step} className="flex items-start gap-3">
              <span className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                item.status === 'done'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
              )}>
                {item.status === 'done' ? '✓' : item.step}
              </span>
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
                <span className="ml-2 text-xs text-slate-400">— {item.note}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SunatPage() {
  return (
    <>
      <PageHeader
        title="SUNAT"
        subtitle="Validación de documentos y facturación electrónica."
      />
      <div className="space-y-6">
        <ValidateDocSection />
        <ElectronicInvoiceSection />
      </div>
    </>
  );
}
