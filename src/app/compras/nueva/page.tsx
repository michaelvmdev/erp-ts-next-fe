'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PickerModal } from '@/components/picker-modal';
import {
  BoxIcon,
  CheckIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  TruckIcon,
} from '@/components/icons';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import {
  ApiError,
  api,
  type Product,
  type Purchase,
  type Supplier,
} from '@/lib/api';

const IGV_RATE = 0.18;

const searchIconButtonClass =
  'inline-flex size-[38px] shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

interface LineItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt
        className={cn(
          emphasize
            ? 'font-semibold text-slate-900 dark:text-white'
            : 'text-slate-500 dark:text-slate-400',
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          'tabular-nums',
          emphasize
            ? 'text-lg font-bold text-slate-900 dark:text-white'
            : 'font-medium text-slate-700 dark:text-slate-200',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export default function NuevaCompraPage() {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [pickedProduct, setPickedProduct] = useState<Product | null>(null);
  const [pickedQty, setPickedQty] = useState(1);
  const [pickedPrice, setPickedPrice] = useState('');

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Purchase | null>(null);

  const totals = useMemo(() => {
    const subTotal = lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
    const igv = Math.round(subTotal * IGV_RATE * 100) / 100;
    return { subTotal, igv, total: subTotal + igv };
  }, [lines]);

  function addLine() {
    if (!pickedProduct || pickedQty < 1 || !pickedPrice) return;
    const price = Number(pickedPrice);
    if (isNaN(price) || price <= 0) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.product.productId === pickedProduct.productId);
      if (existing) {
        return prev.map((l) =>
          l.product.productId === pickedProduct.productId
            ? { ...l, quantity: l.quantity + pickedQty, unitPrice: price }
            : l,
        );
      }
      return [...prev, { product: pickedProduct, quantity: pickedQty, unitPrice: price }];
    });
    setPickedProduct(null);
    setPickedQty(1);
    setPickedPrice('');
  }

  function updateLine(productId: string, field: 'quantity' | 'unitPrice', value: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.product.productId === productId ? { ...l, [field]: Math.max(field === 'quantity' ? 1 : 0.01, value) } : l,
      ),
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.productId !== productId));
  }

  const canSubmit = supplier !== null && lines.length > 0 && !submitting;

  async function submit() {
    if (!canSubmit || !supplier) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.purchases.create({
        supplierId: supplier.supplierId,
        purchaseDate: purchaseDate || undefined,
        purchaseDetails: lines.map((l) => ({
          productId: l.product.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      setResult(created);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.code ?? err.status}: ${err.message}`
          : (err as Error).message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSupplier(null);
    setPurchaseDate('');
    setLines([]);
    setPickedProduct(null);
    setPickedQty(1);
    setPickedPrice('');
    setResult(null);
    setError(null);
  }

  // --- Pantalla de éxito ---------------------------------------------------
  if (result) {
    return (
      <>
        <PageHeader
          title="Compra registrada"
          subtitle="La compra se registró correctamente."
        />
        <Card className="mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckIcon className="size-7" />
          </span>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Compra ID</p>
          <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-white">
            {result.purchaseId}
          </p>

          <dl className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800/50">
            <Row label="Fecha" value={`${result.purchaseDate} ${result.purchaseHour}`} />
            <Row label="Subtotal" value={formatCurrency(result.subTotal)} />
            <Row label="IGV (18%)" value={formatCurrency(result.igv)} />
            <div className="border-t border-slate-200 pt-2 dark:border-slate-700">
              <Row label="Total" value={formatCurrency(result.total)} emphasize />
            </div>
          </dl>

          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={resetForm}>
              <PlusIcon className="size-4" />
              Nueva compra
            </Button>
            <Link href="/compras/buscar">
              <Button variant="secondary">Ir a buscar</Button>
            </Link>
          </div>
        </Card>
      </>
    );
  }

  // --- Formulario ----------------------------------------------------------
  return (
    <>
      <PageHeader title="Nueva compra" subtitle="Registra una compra a un proveedor." />

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Proveedor */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <TruckIcon className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
              Proveedor
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                {supplier ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {supplier.supplierDescription}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      · {supplier.supplierRuc}
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">Ningún proveedor seleccionado</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSupplierModalOpen(true)}
                aria-label="Buscar proveedor"
                title="Buscar proveedor"
                className={searchIconButtonClass}
              >
                <SearchIcon className="size-5 shrink-0" />
              </button>
            </div>
          </Card>

          {/* Fecha */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Fecha de compra
            </h2>
            <div className="max-w-xs">
              <label className={labelClass}>Fecha (opcional — por defecto hoy)</label>
              <input
                type="date"
                className={inputClass}
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </Card>

          {/* Productos */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <BoxIcon className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
              Productos
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className={labelClass}>Producto</label>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                    {pickedProduct ? (
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {pickedProduct.productName}
                      </span>
                    ) : (
                      <span className="text-slate-400">Ningún producto seleccionado</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(true)}
                    aria-label="Buscar producto"
                    title="Buscar producto"
                    className={searchIconButtonClass}
                  >
                    <SearchIcon className="size-5 shrink-0" />
                  </button>
                </div>
              </div>
              <div className="w-full sm:w-24">
                <label className={labelClass}>Cantidad</label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  className={inputClass}
                  value={pickedQty}
                  onChange={(e) => setPickedQty(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div className="w-full sm:w-32">
                <label className={labelClass}>P. costo (S/)</label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                  value={pickedPrice}
                  onChange={(e) => setPickedPrice(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={addLine}
                disabled={!pickedProduct || !pickedPrice}
                className="sm:w-auto"
              >
                <PlusIcon className="size-4" />
                Agregar
              </Button>
            </div>

            {/* Tabla de líneas */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    <th className="py-2 pr-3 font-medium">Producto</th>
                    <th className="py-2 pr-3 text-center font-medium">Cant.</th>
                    <th className="py-2 pr-3 text-right font-medium">P. costo</th>
                    <th className="py-2 pr-3 text-right font-medium">Parcial</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-slate-400 dark:text-slate-500"
                      >
                        Aún no agregaste productos.
                      </td>
                    </tr>
                  )}
                  {lines.map((l) => (
                    <tr
                      key={l.product.productId}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-2 pr-3 text-slate-800 dark:text-slate-200">
                        {l.product.productName}
                      </td>
                      <td className="py-2 pr-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={l.quantity}
                          onChange={(e) =>
                            updateLine(l.product.productId, 'quantity', Number(e.target.value) || 1)
                          }
                          className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-center text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={l.unitPrice}
                          onChange={(e) =>
                            updateLine(l.product.productId, 'unitPrice', Number(e.target.value) || 0.01)
                          }
                          className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                        {formatCurrency(l.unitPrice * l.quantity)}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(l.product.productId)}
                          aria-label="Quitar producto"
                          className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Resumen lateral */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Resumen
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatCurrency(totals.subTotal)} />
              <Row label="IGV (18%)" value={formatCurrency(totals.igv)} />
              <div className="border-t border-slate-200 pt-2 dark:border-slate-700">
                <Row label="Total" value={formatCurrency(totals.total)} emphasize />
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Importes estimados. El backend calcula los valores definitivos al registrar.
            </p>

            <Button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="mt-5 w-full"
            >
              {submitting ? 'Registrando…' : 'Registrar compra'}
            </Button>

            {!canSubmit && !submitting && (
              <ul className="mt-3 space-y-1 text-xs text-slate-400 dark:text-slate-500">
                {!supplier && <li>· Selecciona un proveedor</li>}
                {lines.length === 0 && <li>· Agrega al menos un producto</li>}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Modal: buscar proveedor */}
      <PickerModal<Supplier>
        open={supplierModalOpen}
        title="Buscar proveedor"
        searchPlaceholder="Nombre o RUC…"
        headers={['Proveedor', 'RUC']}
        getKey={(s) => s.supplierId}
        renderCells={(s) => [s.supplierDescription, s.supplierRuc]}
        fetchPage={(q, page, signal) => {
          const onlyDigits = /^\d+$/.test(q);
          return api.suppliers.list(
            {
              supplierDescription: !onlyDigits && q ? q : undefined,
              supplierRuc: onlyDigits && q ? q : undefined,
              supplierActive: true,
              page,
              limit: 5,
            },
            signal,
          );
        }}
        onSelect={(s) => {
          setSupplier(s);
          setSupplierModalOpen(false);
        }}
        onClose={() => setSupplierModalOpen(false)}
      />

      {/* Modal: buscar producto */}
      <PickerModal<Product>
        open={productModalOpen}
        title="Buscar producto"
        searchPlaceholder="Nombre del producto…"
        headers={['Producto', 'P. venta ref.']}
        getKey={(p) => p.productId}
        renderCells={(p) => [p.productName, formatCurrency(p.productUnitPrice)]}
        fetchPage={(q, page, signal) =>
          api.products.query(
            { productDescription: q || undefined, productActive: true, page, limit: 5 },
            signal,
          )
        }
        onSelect={(p) => {
          setPickedProduct(p);
          setProductModalOpen(false);
        }}
        onClose={() => setProductModalOpen(false)}
      />
    </>
  );
}
