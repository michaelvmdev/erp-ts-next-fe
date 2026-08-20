'use client';

import { useRef, useState } from 'react';
import { Card, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

type EntityType = 'products' | 'clients' | 'suppliers';

const ENTITY_LABELS: Record<EntityType, string> = {
  products:  'Productos',
  clients:   'Clientes',
  suppliers: 'Proveedores',
};

const ENTITY_COLUMNS: Record<EntityType, string[]> = {
  products:  ['código', 'descripción', 'precio_unitario', 'categoria_id (opcional)', 'unidad_id (opcional)'],
  clients:   ['descripción', 'tipo_documento_id', 'numero_documento'],
  suppliers: ['descripción', 'ruc'],
};

async function uploadFile(entity: EntityType, file: File): Promise<ImportResult> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const token   = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${baseUrl}/imports/${entity}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ImportResult>;
}

function ImportCard({ entity }: { entity: EntityType }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<ImportResult | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  async function handle(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await uploadFile(entity, file);
      setResult(r);
    } catch (e) {
      setError((e as Error).message ?? 'Error al importar.');
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handle(file);
  }

  return (
    <Card className="p-5">
      <h2 className="mb-1 text-base font-bold text-slate-900 dark:text-white">
        Importar {ENTITY_LABELS[entity]}
      </h2>
      <p className="mb-1 text-xs text-slate-500">
        Columnas (fila 1 = cabecera):&nbsp;
        {ENTITY_COLUMNS[entity].map((c, i) => (
          <span key={i} className="mr-1 rounded bg-slate-100 px-1 font-mono text-[10px] dark:bg-slate-800">{c}</span>
        ))}
      </p>
      <p className="mb-4 text-xs text-slate-400">Upsert — actualiza si ya existe el identificador único.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'mb-4 flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition',
          dragging
            ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/20'
            : 'border-slate-300 bg-slate-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800/40',
        )}
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Procesando…' : 'Arrastra un archivo CSV o XLSX aquí, o haz clic'}
        </p>
        <p className="mt-1 text-xs text-slate-400">Max 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }}
        />
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              ✓ {result.imported} importados
            </span>
            {result.skipped > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                ⚠ {result.skipped} omitidos
              </span>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-300">
                  Fila {e.row}: {e.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function ImportarPage() {
  return (
    <>
      <PageHeader
        title="Importación masiva"
        subtitle="Carga CSV o XLSX para crear o actualizar registros en bloque."
      />
      <div className="space-y-4">
        <ImportCard entity="products" />
        <ImportCard entity="clients" />
        <ImportCard entity="suppliers" />
      </div>
    </>
  );
}
