'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PickerModal } from '@/components/picker-modal';
import { ApiError, api, type PriceList, type PriceListItem, type Product } from '@/lib/api';
import { Button, Card, inputClass, PageHeader } from '@/components/ui';
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatPrice(n: number) {
  return `S/ ${fmt.format(n)}`;
}

// ─── Draft types ─────────────────────────────────────────────────────────────

interface DraftItem {
  productId: string;
  productName: string;
  catalogPrice: number;
  customPrice: string;
}

function serverItemToDraft(item: PriceListItem): DraftItem {
  return {
    productId: item.productId,
    productName: item.productName,
    catalogPrice: item.catalogPrice,
    customPrice: String(item.customPrice),
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PriceListDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [priceList, setPriceList] = useState<PriceList | null>(null);
  const [headerLoading, setHeaderLoading] = useState(true);
  const [headerError, setHeaderError] = useState<string | null>(null);

  const [items, setItems] = useState<DraftItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load header
  useEffect(() => {
    const c = new AbortController();
    setHeaderLoading(true);
    setHeaderError(null);
    api.priceLists
      .get(id, c.signal)
      .then((pl) => {
        if (!c.signal.aborted) setPriceList(pl);
      })
      .catch(() => {
        if (!c.signal.aborted) setHeaderError('No se pudo cargar la lista de precio.');
      })
      .finally(() => {
        if (!c.signal.aborted) setHeaderLoading(false);
      });
    return () => c.abort();
  }, [id]);

  // Load items
  useEffect(() => {
    const c = new AbortController();
    setItemsLoading(true);
    setItemsError(null);
    api.priceLists
      .getItems(id, c.signal)
      .then((serverItems) => {
        if (!c.signal.aborted) setItems(serverItems.map(serverItemToDraft));
      })
      .catch(() => {
        if (!c.signal.aborted) setItemsError('No se pudieron cargar los items.');
      })
      .finally(() => {
        if (!c.signal.aborted) setItemsLoading(false);
      });
    return () => c.abort();
  }, [id]);

  // Product picker fetchPage
  const fetchProductPage = useCallback(
    (q: string, page: number, signal: AbortSignal) =>
      api.products.query(
        { productDescription: q || undefined, productActive: true, page, limit: 5 },
        signal,
      ),
    [],
  );

  function addProduct(product: Product) {
    setPickerOpen(false);
    setSaveSuccess(false);
    setItems((prev) => {
      const exists = prev.find((i) => i.productId === product.productId);
      if (exists) return prev;
      return [
        ...prev,
        {
          productId: product.productId,
          productName: product.productName,
          catalogPrice: product.productUnitPrice,
          customPrice: String(product.productUnitPrice),
        },
      ];
    });
  }

  function removeItem(productId: string) {
    setSaveSuccess(false);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function setCustomPrice(productId: string, value: string) {
    setSaveSuccess(false);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, customPrice: value } : i)),
    );
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const payload = items.map((i) => ({
        productId: i.productId,
        customPrice: parseFloat(i.customPrice) || 0,
      }));
      await api.priceLists.updateItems(id, { items: payload });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : 'No se pudieron guardar los cambios.',
      );
    } finally {
      setSaving(false);
    }
  }

  const hasInvalidPrice = items.some((i) => {
    const n = parseFloat(i.customPrice);
    return isNaN(n) || n <= 0;
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  if (headerError) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-red-500">{headerError}</p>
        <Link href="/admin/price-lists">
          <Button variant="secondary">
            <ChevronLeftIcon className="size-4" />
            Volver a listas
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb / header */}
      <div className="mb-1">
        <Link
          href="/admin/price-lists"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <ChevronLeftIcon className="size-3" />
          Listas de precio
        </Link>
      </div>

      <PageHeader
        title={headerLoading ? 'Cargando…' : (priceList?.priceListDescription ?? '—')}
        subtitle={
          priceList
            ? [
                priceList.validFrom
                  ? `Desde ${new Date(priceList.validFrom).toLocaleDateString('es-PE')}`
                  : null,
                priceList.validTo
                  ? `Hasta ${new Date(priceList.validTo).toLocaleDateString('es-PE')}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Sin vigencia definida'
            : ''
        }
        actions={
          <Button onClick={() => setPickerOpen(true)}>
            <PlusIcon className="size-4" />
            Agregar producto
          </Button>
        }
      />

      {/* Items table */}
      <Card className="mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 text-right font-medium">Precio catálogo</th>
                <th className="px-4 py-3 text-right font-medium">Precio de lista</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    Cargando…
                  </td>
                </tr>
              )}
              {!itemsLoading && itemsError && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-red-500">
                    {itemsError}
                  </td>
                </tr>
              )}
              {!itemsLoading && !itemsError && items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    Sin productos. Usa "Agregar producto" para comenzar.
                  </td>
                </tr>
              )}
              {!itemsLoading &&
                !itemsError &&
                items.map((item) => {
                  const numPrice = parseFloat(item.customPrice);
                  const priceInvalid = isNaN(numPrice) || numPrice <= 0;
                  const discount =
                    !priceInvalid && item.catalogPrice > 0
                      ? ((item.catalogPrice - numPrice) / item.catalogPrice) * 100
                      : null;

                  return (
                    <tr
                      key={item.productId}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">
                        {formatPrice(item.catalogPrice)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">S/</span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.customPrice}
                              onChange={(e) => setCustomPrice(item.productId, e.target.value)}
                              className={cn(
                                inputClass,
                                'w-28 text-right tabular-nums',
                                priceInvalid && 'border-red-400 ring-red-200 dark:border-red-600',
                              )}
                            />
                          </div>
                          {discount !== null && Math.abs(discount) >= 0.01 && (
                            <span
                              className={cn(
                                'text-[10px] font-medium',
                                discount > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-500 dark:text-red-400',
                              )}
                            >
                              {discount > 0 ? '▼' : '▲'}{' '}
                              {Math.abs(discount).toFixed(1)}%{' '}
                              {discount > 0 ? 'descuento' : 'sobre catálogo'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          aria-label="Quitar producto"
                          title="Quitar producto"
                          className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer: save */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {items.length} producto{items.length === 1 ? '' : 's'} en la lista
          </p>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Cambios guardados
              </span>
            )}
            {saveError && (
              <span className="text-sm text-red-500">{saveError}</span>
            )}
            <Button
              onClick={save}
              disabled={saving || hasInvalidPrice || itemsLoading}
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Product picker */}
      <PickerModal<Product>
        open={pickerOpen}
        title="Agregar producto"
        searchPlaceholder="Nombre del producto…"
        headers={['Producto', 'Precio catálogo']}
        getKey={(p) => p.productId}
        renderCells={(p) => [p.productName, formatPrice(p.productUnitPrice)]}
        fetchPage={fetchProductPage}
        onSelect={addProduct}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
