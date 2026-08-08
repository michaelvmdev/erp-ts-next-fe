'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, type CreditNoteDetail } from '@/lib/api';
import { Button, Card, PageHeader } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { ChevronLeftIcon } from '@/components/icons';

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function CreditNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<CreditNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const c = new AbortController();
    setLoading(true);
    api.creditNotes
      .get(id, c.signal)
      .then((n) => { setNote(n); setLoading(false); })
      .catch(() => { setError('No se pudo cargar la nota de crédito.'); setLoading(false); });
    return () => c.abort();
  }, [id]);

  if (loading) return <div className="py-20 text-center text-slate-400">Cargando…</div>;

  if (error || !note) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-red-500">{error ?? 'Nota no encontrada.'}</p>
        <Link href="/credit-notes"><Button variant="secondary"><ChevronLeftIcon className="size-4" /> Volver</Button></Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={note.number}
        subtitle={`Venta de origen: ${note.saleId.slice(0, 8)}… · Emitida el ${fmtDate(note.date)} ${note.hour}`}
        actions={
          <Link href="/credit-notes">
            <Button variant="secondary"><ChevronLeftIcon className="size-4" /> Volver</Button>
          </Link>
        }
      />

      {/* Encabezado */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Motivo</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{note.reason}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Referencia de venta</p>
          <Link href={`/ventas/buscar?saleId=${note.saleId}`} className="font-mono text-sm text-blue-600 hover:underline dark:text-blue-400">
            {note.saleId}
          </Link>
        </Card>
      </div>

      {/* Líneas */}
      <Card className="mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 text-right font-medium">Precio unit.</th>
                <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                <th className="px-4 py-3 text-right font-medium">Parcial</th>
              </tr>
            </thead>
            <tbody>
              {note.lines.map((l) => (
                <tr key={l.item} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-400">{l.item}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.productId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(l.unitPrice)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(l.partial)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Totales */}
      <div className="flex justify-end">
        <Card className="w-64 divide-y divide-slate-100 p-0 dark:divide-slate-800">
          {[
            { label: 'Subtotal', value: note.subTotal },
            { label: 'IGV (18%)', value: note.igv },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-4 py-3 text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="tabular-nums">{formatCurrency(value)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold tabular-nums">{formatCurrency(note.total)}</span>
          </div>
        </Card>
      </div>
    </>
  );
}
