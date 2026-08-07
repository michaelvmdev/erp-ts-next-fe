'use client';

import { useState } from 'react';
import { ApiError, api, type Client, type DocumentType } from '@/lib/api';
import { Button, inputClass, labelClass } from './ui';
import { CloseIcon } from './icons';

interface ClientFormModalProps {
  /** null = crear; un cliente = editar. */
  client: Client | null;
  documentTypes: DocumentType[];
  onClose: () => void;
  onSaved: () => void;
}

/** Longitud esperada segun el tipo de documento (contrato: 1=DNI 8 digitos, 2=RUC 11). */
function expectedLength(documentTypeId: number): number | null {
  if (documentTypeId === 1) return 8;
  if (documentTypeId === 2) return 11;
  return null;
}

/** Modal de alta/edicion de un cliente. */
export function ClientFormModal({
  client,
  documentTypes,
  onClose,
  onSaved,
}: ClientFormModalProps) {
  const editing = client !== null;

  const [description, setDescription] = useState(client?.clientDescription ?? '');
  const [documentTypeId, setDocumentTypeId] = useState(
    client ? String(client.documentTypeId) : '',
  );
  const [documentNumber, setDocumentNumber] = useState(client?.documentNumber ?? '');
  const [active, setActive] = useState(client?.clientActive ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docLen = documentTypeId ? expectedLength(Number(documentTypeId)) : null;
  const documentNumberValid =
    /^\d+$/.test(documentNumber) &&
    (docLen === null ? documentNumber.length === 8 || documentNumber.length === 11 : documentNumber.length === docLen);

  const valid =
    description.trim() !== '' && documentTypeId !== '' && documentNumberValid;

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const common = {
        clientDescription: description.trim(),
        documentTypeId: Number(documentTypeId),
        documentNumber: documentNumber.trim(),
        clientActive: active,
      };
      if (editing) {
        await api.clients.update(client.clientId, common);
      } else {
        await api.clients.create(common);
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? Array.isArray(err.body?.message)
            ? err.body.message.join(' ')
            : err.message
          : 'No se pudo guardar el cliente.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Editar cliente' : 'Nuevo cliente'}
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {editing ? 'Editar cliente' : 'Nuevo cliente'}
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

        <div className="space-y-4 p-5">
          <div>
            <label className={labelClass} htmlFor="c-desc">
              Razon social / Nombre completo
            </label>
            <input
              id="c-desc"
              type="text"
              className={inputClass}
              maxLength={100}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Comercial San Martin S.A.C."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="c-doctype">
                Tipo de documento
              </label>
              <select
                id="c-doctype"
                className={inputClass}
                value={documentTypeId}
                onChange={(e) => setDocumentTypeId(e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {documentTypes.map((d) => (
                  <option key={d.documentTypeId} value={d.documentTypeId}>
                    {d.documentTypeDescription}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="c-docnum">
                N° documento
              </label>
              <input
                id="c-docnum"
                type="text"
                inputMode="numeric"
                className={inputClass}
                maxLength={11}
                value={documentNumber}
                onChange={(e) =>
                  setDocumentNumber(e.target.value.replace(/\D/g, ''))
                }
                placeholder={docLen ? '0'.repeat(docLen) : 'Solo digitos'}
              />
              {documentNumber !== '' && !documentNumberValid && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {docLen
                    ? `Debe tener ${docLen} digitos.`
                    : 'Debe tener 8 (DNI) u 11 (RUC) digitos.'}
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Cliente activo
          </label>

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </div>
    </div>
  );
}
