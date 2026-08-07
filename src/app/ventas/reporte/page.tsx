'use client';

import { useState } from 'react';
import { salesApi } from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { CloseIcon, DownloadIcon, EyeIcon, MailIcon } from '@/components/icons';

export default function ReporteVentasPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);

  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const datesValid = !!from && !!to && from <= to;
  const dateError = from && to && from > to ? 'La fecha de inicio no puede ser mayor que la de fin.' : null;

  function handleDownload() {
    window.open(salesApi.reportDownloadUrl(from, to), '_blank');
  }

  function openEmailModal() {
    setSendResult(null);
    setEmailOpen(true);
  }

  function closeEmailModal() {
    setEmailOpen(false);
    setSendResult(null);
  }

  async function handleSendEmail() {
    if (!email.trim() || !datesValid) return;
    setSending(true);
    setSendResult(null);
    try {
      await salesApi.sendReportEmail(email.trim(), from, to);
      setSendResult({ ok: true, msg: 'Reporte enviado correctamente.' });
    } catch {
      setSendResult({ ok: false, msg: 'No se pudo enviar el reporte. Verifica que el backend esté activo.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Reporte de ventas"
        subtitle="Genera el reporte de ventas por rango de fechas para descargarlo o enviarlo por correo."
      />

      <Card className="max-w-md p-6">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="from">Desde</label>
              <input
                id="from"
                type="date"
                className={inputClass}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="to">Hasta</label>
              <input
                id="to"
                type="date"
                className={inputClass}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {dateError && (
            <p className="text-sm text-red-500 dark:text-red-400">{dateError}</p>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={handleDownload} disabled={!datesValid}>
              <DownloadIcon className="size-4" />
              Descargar
            </Button>
            <Button variant="secondary" onClick={() => setPreviewOpen(true)} disabled={!datesValid}>
              <EyeIcon className="size-4" />
              Generar correo
            </Button>
            <Button variant="secondary" onClick={openEmailModal} disabled={!datesValid}>
              <MailIcon className="size-4" />
              Enviar por correo
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal: vista previa del reporte */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false); }}
        >
          <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Cabecera */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Vista previa del reporte
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {from} → {to}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleDownload} className="text-xs px-3 py-1.5">
                  <DownloadIcon className="size-3.5" />
                  Descargar
                </Button>
                <Button
                  onClick={() => { setPreviewOpen(false); openEmailModal(); }}
                  className="text-xs px-3 py-1.5"
                >
                  <MailIcon className="size-3.5" />
                  Enviar por correo
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Cerrar vista previa"
                  className="ml-1 inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <CloseIcon className="size-4" />
                </button>
              </div>
            </div>

            {/* Iframe del PDF */}
            <iframe
              src={salesApi.reportDownloadUrl(from, to)}
              className="min-h-0 flex-1 rounded-b-xl"
              title="Vista previa del reporte de ventas"
            />
          </div>
        </div>
      )}

      {/* Popup de correo */}
      {emailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeEmailModal(); }}
        >
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl dark:bg-slate-900">
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Enviar reporte por correo
              </h2>
              <button
                type="button"
                onClick={closeEmailModal}
                aria-label="Cerrar"
                className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="px-5 py-5 space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Se enviará el reporte del{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">{from}</span>
                {' '}al{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">{to}</span>.
              </p>

              <div>
                <label className={labelClass} htmlFor="email-input">
                  Correo electrónico
                </label>
                <input
                  id="email-input"
                  type="email"
                  className={inputClass}
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendEmail(); }}
                  autoFocus
                  disabled={sending}
                />
              </div>

              {sendResult && (
                <p
                  className={`text-sm ${
                    sendResult.ok
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {sendResult.msg}
                </p>
              )}
            </div>

            {/* Pie */}
            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
              <Button variant="secondary" onClick={closeEmailModal} disabled={sending}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={!email.trim() || sending}
              >
                <MailIcon className="size-4" />
                {sending ? 'Enviando…' : 'Enviar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
