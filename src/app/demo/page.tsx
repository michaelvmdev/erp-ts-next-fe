'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Brand, DocumentType, SaleType } from '@/lib/api';

/**
 * Pagina de demostracion del cliente tipado (`@/lib/api`).
 *
 * Consume tres endpoints via el proxy `/api/*` y renderiza el resultado, para
 * comprobar de punta a punta que front -> proxy -> backend funciona.
 */
export default function DemoPage() {
  const [saleTypes, setSaleTypes] = useState<SaleType[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        const [st, dt, brandPage] = await Promise.all([
          api.saleTypes.list(signal),
          api.documentTypes.list(signal),
          api.brands.list({ limit: 5, sortDirection: 'ASC' }, signal),
        ]);
        setSaleTypes(st);
        setDocumentTypes(dt);
        setBrands(brandPage.items);
        setTotal(brandPage.meta.total);
      } catch (err) {
        if (signal.aborted) return;
        setError(
          err instanceof ApiError
            ? `${err.status} ${err.code ?? ''} — ${err.message}`
            : (err as Error).message,
        );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 font-sans">
      <h1 className="text-2xl font-bold">Demo del cliente tipado</h1>
      <p className="mt-1 text-sm text-gray-500">
        Datos traidos del backend a traves del proxy{' '}
        <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">/api</code>.
      </p>

      {loading && <p className="mt-8 text-gray-500">Cargando…</p>}

      {error && (
        <p className="mt-8 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Error: {error}
          <br />
          <span className="text-xs">
            ¿Esta corriendo el backend en{' '}
            <code>BACKEND_API_URL</code>?
          </span>
        </p>
      )}

      {!loading && !error && (
        <div className="mt-8 space-y-8">
          <Section title="Tipos de comprobante (GET /api/sale-types)">
            <ul className="text-sm">
              {saleTypes.map((s) => (
                <li key={s.saleTypeId}>
                  <span className="font-mono">{s.saleTypeCode}</span> ·{' '}
                  {s.saleTypeDescription}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Tipos de documento (GET /api/document-types)">
            <ul className="text-sm">
              {documentTypes.map((d) => (
                <li key={d.documentTypeId}>
                  {d.documentTypeId} · {d.documentTypeDescription}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={`Marcas — primeras 5 de ${total} (GET /api/brands)`}>
            <ul className="text-sm">
              {brands.map((b) => (
                <li key={b.brandId}>
                  {b.brandDescription}{' '}
                  {!b.brandActive && (
                    <span className="text-xs text-gray-400">(inactiva)</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {title}
      </h2>
      {children}
    </section>
  );
}
