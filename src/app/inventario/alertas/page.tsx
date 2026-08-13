'use client';

import { useEffect, useState } from 'react';
import { api, type StockAlert } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

function severityClass(deficit: number, minimum: number) {
  const ratio = minimum > 0 ? deficit / minimum : 1;
  if (ratio >= 1) return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400';
  if (ratio >= 0.5) return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400';
}

export default function StockAlertasPage() {
  const [alerts,  setAlerts]  = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    api.inventory.alerts(ctrl.signal)
      .then(setAlerts)
      .catch((e: Error) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de stock"
        subtitle="Productos cuyo nivel de stock está por debajo del mínimo configurado."
      />

      <Card className="p-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-zinc-500">No hay productos con stock bajo mínimo. ✓</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 mb-4">
              {alerts.length} producto{alerts.length !== 1 ? 's' : ''} requiere{alerts.length !== 1 ? 'n' : ''} reposición.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
                    <th className="py-2 pr-3 text-left">Producto</th>
                    <th className="py-2 pr-3 text-left">Almacén</th>
                    <th className="py-2 pr-3 text-right">Stock actual</th>
                    <th className="py-2 pr-3 text-right">Mínimo</th>
                    <th className="py-2 text-right">Déficit</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr
                      key={`${a.productId}-${a.warehouseId}`}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <td className="py-2 pr-3 font-medium">{a.productName}</td>
                      <td className="py-2 pr-3 text-zinc-500">{a.warehouseCode}</td>
                      <td className="py-2 pr-3 text-right">{a.currentStock}</td>
                      <td className="py-2 pr-3 text-right">{a.minimumStock}</td>
                      <td className="py-2 text-right">
                        <span className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                          severityClass(a.deficit, a.minimumStock),
                        )}>
                          -{a.deficit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
