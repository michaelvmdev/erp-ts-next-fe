'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ApiError, salesApi, type SalePdf } from '@/lib/api';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { CloseIcon, DownloadIcon, EyeIcon, MailIcon } from '@/components/icons';

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

function triggerDownload(pdf: SalePdf) {
  const blob = base64ToBlob(pdf.base64, pdf.mimeType || 'application/pdf');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pdf.fileName || 'monto-por-cliente.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MontoClientePage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [pdf, setPdf] = useState<SalePdf | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [loadingExcel, setLoadingExcel] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [excelEmailOpen, setExcelEmailOpen] = useState(false);
  const [sendingExcel, setSendingExcel] = useState(false);
  const [excelSendResult, setExcelSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const datesValid = !!from && !!to && from <= to;
  const dateError = from && to && from > to ? 'La fecha de inicio no puede ser mayor que la de fin.' : null;

  useEffect(() => { setPdf(null); setPdfError(null); setExcelError(null); }, [from, to]);

  async function fetchPdf(): Promise<SalePdf | null> {
    if (pdf) return pdf;
    setLoadingPdf(true);
    setPdfError(null);
    try {
      const res = await salesApi.clientsAmountReport(from, to);
      setPdf(res);
      return res;
    } catch (err) {
      setPdfError(err instanceof ApiError ? err.message : 'No se pudo generar el reporte.');
      return null;
    } finally {
      setLoadingPdf(false);
    }
  }

  async function handleDownload() {
    const p = await fetchPdf();
    if (p) triggerDownload(p);
  }

  async function handlePreview() {
    setPreviewOpen(true);
    await fetchPdf();
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
      await salesApi.sendClientsAmountReportEmail(email.trim(), from, to);
      setSendResult({ ok: true, msg: 'Reporte enviado correctamente.' });
    } catch (err) {
      setSendResult({
        ok: false,
        msg: err instanceof ApiError ? err.message : 'No se pudo enviar el reporte.',
      });
    } finally {
      setSending(false);
    }
  }

  async function handleExcelDownload() {
    if (!datesValid) return;
    setLoadingExcel(true); setExcelError(null);
    try {
      const res = await salesApi.clientsAmountReportExcel(from, to);
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: res.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = res.fileName; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setExcelError(err instanceof ApiError ? err.message : 'No se pudo generar el Excel.');
    } finally { setLoadingExcel(false); }
  }

  async function handleExcelEmail() {
    if (!email.trim() || !datesValid) return;
    setSendingExcel(true); setExcelSendResult(null);
    try {
      const res = await salesApi.sendClientsAmountReportExcelEmail(email.trim(), from, to);
      setExcelSendResult({ ok: true, msg: `Excel enviado a ${res.to}.` });
    } catch (err) {
      setExcelSendResult({ ok: false, msg: err instanceof ApiError ? err.message : 'No se pudo enviar el Excel.' });
    } finally { setSendingExcel(false); }
  }

  return (
    <>
      <PageHeader
        title="Monto por cliente"
        subtitle="Reporte del monto total facturado por cliente en un rango de fechas."
      />

      <Card className="max-w-md p-6">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="mc-from">Desde</label>
              <input
                id="mc-from"
                type="date"
                className={inputClass}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="mc-to">Hasta</label>
              <input
                id="mc-to"
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
            <Button onClick={handleDownload} disabled={!datesValid || loadingPdf}>
              <DownloadIcon className="size-4" />
              {loadingPdf ? 'Generando…' : 'Descargar'}
            </Button>
            <Button variant="secondary" onClick={handlePreview} disabled={!datesValid || loadingPdf}>
              <EyeIcon className="size-4" />
              Vista previa
            </Button>
            <Button variant="secondary" onClick={openEmailModal} disabled={!datesValid}>
              <MailIcon className="size-4" />
              Enviar por correo
            </Button>
          </div>

          {pdfError && !previewOpen && (
            <p className="text-sm text-red-500 dark:text-red-400">{pdfError}</p>
          )}

          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500">Excel</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleExcelDownload} disabled={!datesValid || loadingExcel}>
                <DownloadIcon className="size-4" />{loadingExcel ? 'Generando…' : 'Descargar Excel'}
              </Button>
              <Button variant="secondary" onClick={() => { setExcelSendResult(null); setExcelEmailOpen(true); }} disabled={!datesValid}>
                <MailIcon className="size-4" />Enviar Excel por correo
              </Button>
            </div>
            {excelError && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{excelError}</p>}
          </div>
        </div>
      </Card>

      {excelEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setExcelEmailOpen(false); setExcelSendResult(null); } }}>
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Enviar Excel por correo</h2>
              <button type="button" onClick={() => { setExcelEmailOpen(false); setExcelSendResult(null); }} aria-label="Cerrar"
                className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                <CloseIcon className="size-4" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Monto por cliente del <span className="font-medium text-slate-700 dark:text-slate-200">{from}</span> al <span className="font-medium text-slate-700 dark:text-slate-200">{to}</span> en Excel.
              </p>
              <div>
                <label className={labelClass} htmlFor="excel-email-mc">Correo electrónico</label>
                <input id="excel-email-mc" type="email" className={inputClass} placeholder="correo@ejemplo.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleExcelEmail(); }}
                  autoFocus disabled={sendingExcel} />
              </div>
              {excelSendResult && (
                <p className={`text-sm ${excelSendResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{excelSendResult.msg}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
              <Button variant="secondary" onClick={() => { setExcelEmailOpen(false); setExcelSendResult(null); }} disabled={sendingExcel}>Cancelar</Button>
              <Button onClick={handleExcelEmail} disabled={!email.trim() || sendingExcel}>
                <MailIcon className="size-4" />{sendingExcel ? 'Enviando…' : 'Enviar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <PreviewModal
          pdf={pdf}
          loading={loadingPdf}
          error={pdfError}
          dateRange={{ from, to }}
          onDownload={() => pdf && triggerDownload(pdf)}
          onEmail={() => { setPreviewOpen(false); openEmailModal(); }}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {emailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeEmailModal(); }}
        >
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl dark:bg-slate-900">
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

            <div className="space-y-4 px-5 py-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Reporte del{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">{from}</span>
                {' '}al{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">{to}</span>.
              </p>

              <div>
                <label className={labelClass} htmlFor="mc-email">Correo electrónico</label>
                <input
                  id="mc-email"
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
                <p className={`text-sm ${sendResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {sendResult.msg}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
              <Button variant="secondary" onClick={closeEmailModal} disabled={sending}>
                Cancelar
              </Button>
              <Button onClick={handleSendEmail} disabled={!email.trim() || sending}>
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

function PreviewModal({
  pdf,
  loading,
  error,
  dateRange,
  onDownload,
  onEmail,
  onClose,
}: {
  pdf: SalePdf | null;
  loading: boolean;
  error: string | null;
  dateRange: { from: string; to: string };
  onDownload: () => void;
  onEmail: () => void;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdf) return;
    const url = URL.createObjectURL(base64ToBlob(pdf.base64, pdf.mimeType || 'application/pdf'));
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vista previa del reporte de monto por cliente"
        className="relative z-10 flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Image src="/erp-mv-dev-logo.svg" alt="ERP MV-DEV" width={28} height={28} className="shrink-0 rounded" />
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Monto por cliente</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{dateRange.from} → {dateRange.to}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onDownload} disabled={!pdf}>
              <DownloadIcon className="size-4" />
              Descargar
            </Button>
            <Button onClick={onEmail}>
              <MailIcon className="size-4" />
              Enviar por correo
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="ml-1 inline-flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-slate-100 dark:bg-slate-950">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <span className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-400" />
              <span className="text-sm">Generando PDF…</span>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-500">{error}</div>
          ) : blobUrl ? (
            <iframe src={blobUrl} title="Monto por cliente" className="h-full w-full" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
