'use client';

import { useEffect, useState } from 'react';
import { ApiError, api, type SaleEmailResult, type SalePdf } from '@/lib/api';
import { Button, inputClass, labelClass } from './ui';
import { CheckIcon, CloseIcon, DownloadIcon, EyeIcon, MailIcon } from './icons';

/** Decodifica un PDF en base64 a un Blob para previsualizar o descargar. */
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
  a.download = pdf.fileName || 'comprobante.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Acciones sobre el comprobante de una venta: vista previa en PDF (popup),
 * descarga y envio por correo (el correo se pide en otro popup).
 */
export function SaleDocumentActions({
  saleId,
  defaultEmail,
}: {
  saleId: string;
  defaultEmail?: string;
}) {
  const [pdf, setPdf] = useState<SalePdf | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  // Trae el PDF una sola vez y lo reutiliza para previsualizar y descargar.
  async function ensurePdf(): Promise<SalePdf | null> {
    if (pdf) return pdf;
    setLoadingPdf(true);
    setPdfError(null);
    try {
      const res = await api.sales.pdf(saleId);
      setPdf(res);
      return res;
    } catch (err) {
      setPdfError(
        err instanceof ApiError ? err.message : 'No se pudo generar el PDF.',
      );
      return null;
    } finally {
      setLoadingPdf(false);
    }
  }

  async function handlePreview() {
    setPreviewOpen(true);
    await ensurePdf();
  }

  async function handleDownload() {
    const p = await ensurePdf();
    if (p) triggerDownload(p);
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={handlePreview}>
          <EyeIcon className="size-4" />
          Vista previa
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownload}
          disabled={loadingPdf}
        >
          <DownloadIcon className="size-4" />
          Descargar
        </Button>
        <Button variant="secondary" onClick={() => setEmailOpen(true)}>
          <MailIcon className="size-4" />
          Enviar por correo
        </Button>
      </div>

      {pdfError && !previewOpen && (
        <p className="mt-2 text-center text-sm text-red-500">{pdfError}</p>
      )}

      {previewOpen && (
        <PdfPreviewModal
          pdf={pdf}
          loading={loadingPdf}
          error={pdfError}
          onDownload={() => pdf && triggerDownload(pdf)}
          onEmail={() => {
            setPreviewOpen(false);
            setEmailOpen(true);
          }}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {emailOpen && (
        <EmailModal
          saleId={saleId}
          defaultEmail={defaultEmail}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </>
  );
}

// --- Vista previa del PDF ----------------------------------------------------

function PdfPreviewModal({
  pdf,
  loading,
  error,
  onDownload,
  onEmail,
  onClose,
}: {
  pdf: SalePdf | null;
  loading: boolean;
  error: string | null;
  onDownload: () => void;
  onEmail: () => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdf) return;
    const blob = base64ToBlob(pdf.base64, pdf.mimeType || 'application/pdf');
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pdf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vista previa del comprobante"
        className="relative z-10 flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Vista previa{pdf?.fileName ? ` · ${pdf.fileName}` : ''}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onDownload} disabled={!pdf}>
              <DownloadIcon className="size-4" />
              Descargar
            </Button>
            <Button variant="secondary" onClick={onEmail}>
              <MailIcon className="size-4" />
              Enviar
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 dark:bg-slate-950">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <span className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-400" />
              <span className="text-sm">Generando PDF…</span>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-500">
              {error}
            </div>
          ) : url ? (
            <iframe src={url} title="Comprobante en PDF" className="h-full w-full" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// --- Envio por correo --------------------------------------------------------

function EmailModal({
  saleId,
  defaultEmail,
  onClose,
}: {
  saleId: string;
  defaultEmail?: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleEmailResult | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function send() {
    if (!valid || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.sales.sendEmail(saleId, email.trim());
      setResult(res);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 503
            ? 'El correo no esta configurado en el servidor (variables MAIL_*).'
            : err.message
          : 'No se pudo enviar el correo.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Enviar comprobante por correo"
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Enviar por correo
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="p-5">
          {result ? (
            <div className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <CheckIcon className="size-6" />
              </span>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Comprobante enviado a{' '}
                <span className="font-medium text-slate-900 dark:text-white">
                  {result.to}
                </span>
                .
              </p>
              <Button className="mt-5 w-full" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              <label className={labelClass} htmlFor="send-email">
                Correo del destinatario
              </label>
              <input
                id="send-email"
                type="email"
                className={inputClass}
                placeholder="cliente@ejemplo.com"
                value={email}
                autoFocus
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
              />
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                Se adjuntara el comprobante en PDF.
              </p>

              {error && (
                <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={send} disabled={!valid || sending}>
                  <MailIcon className="size-4" />
                  {sending ? 'Enviando…' : 'Enviar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
