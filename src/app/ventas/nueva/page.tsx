'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PickerModal } from '@/components/picker-modal';
import { SaleDocumentActions } from '@/components/sale-document';
import {
  BoxIcon,
  CheckIcon,
  MapPinIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  TrashIcon,
  UserIcon,
} from '@/components/icons';
import { Button, Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import {
  ApiError,
  api,
  type Client,
  type Department,
  type District,
  type Product,
  type Province,
  type Sale,
  type SaleType,
} from '@/lib/api';

const IGV_RATE = 0.18;

// Contrato del backend: 1 = DNI, 2 = RUC. Solo los clientes con RUC pueden
// recibir factura; el resto, unicamente boleta.
const RUC_DOCUMENT_TYPE_ID = 2;

function isRuc(client: Client): boolean {
  return client.documentTypeId === RUC_DOCUMENT_TYPE_ID;
}

// Boton cuadrado de solo icono, a la altura de un input (`px-3 py-2 text-sm`).
// No se usa `Button` porque `cn()` no resuelve conflictos de Tailwind y su
// `px-4` base terminaria aplastando el icono.
const searchIconButtonClass =
  'inline-flex size-[38px] shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

interface LineItem {
  product: Product;
  quantity: number;
}

export default function NuevaVentaPage() {
  // Catalogos y seleccion
  const [saleTypes, setSaleTypes] = useState<SaleType[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  // Tipo elegido a mano, atado al cliente para el que se eligio: si cambia el
  // cliente, la eleccion caduca sola y manda el default (ver `saleTypeId`).
  const [saleTypeChoice, setSaleTypeChoice] = useState<{
    clientId: string;
    saleTypeId: number;
  } | null>(null);

  // Ubigeo en cascada
  const [departments, setDepartments] = useState<Department[]>([]);
  const [provinceList, setProvinceList] = useState<{
    departmentId: string;
    items: Province[];
  } | null>(null);
  const [districtList, setDistrictList] = useState<{
    provinceId: string;
    items: District[];
  } | null>(null);
  const [departmentId, setDepartmentId] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');

  // Las listas solo valen para el padre con el que se pidieron; mientras llega
  // la nueva peticion se muestra vacio, sin tener que limpiarlas desde el efecto.
  const provinces =
    provinceList?.departmentId === departmentId ? provinceList.items : [];
  const districts =
    districtList?.provinceId === provinceId ? districtList.items : [];

  // Lineas de detalle
  const [lines, setLines] = useState<LineItem[]>([]);
  const [pickedProduct, setPickedProduct] = useState<Product | null>(null);
  const [pickedQty, setPickedQty] = useState(1);

  // Modales de busqueda
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Envio
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Sale | null>(null);

  // Carga inicial de catalogos
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.saleTypes.list(controller.signal),
      api.ubigeo.departments(controller.signal),
    ])
      .then(([types, deps]) => {
        setSaleTypes(types);
        setDepartments(deps);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('No se pudieron cargar los catalogos. ¿Esta activo el backend?');
        }
      });
    return () => controller.abort();
  }, []);

  // El tipo de comprobante lo determina el documento del cliente:
  // con RUC -> factura por defecto; sin RUC -> boleta forzada. La eleccion
  // manual solo pesa si sigue siendo del cliente actual.
  const defaultSaleTypeId = useMemo(() => {
    if (!client) return null;
    const code = isRuc(client) ? 'FAC' : 'BOL';
    return saleTypes.find((t) => t.saleTypeCode === code)?.saleTypeId ?? null;
  }, [client, saleTypes]);

  const saleTypeId =
    client && saleTypeChoice?.clientId === client.clientId
      ? saleTypeChoice.saleTypeId
      : defaultSaleTypeId;

  // Provincias segun departamento
  useEffect(() => {
    if (!departmentId) return;
    const controller = new AbortController();
    api.ubigeo
      .provinces(departmentId, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setProvinceList({ departmentId, items });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [departmentId]);

  // Distritos segun provincia
  useEffect(() => {
    if (!provinceId) return;
    const controller = new AbortController();
    api.ubigeo
      .districts(provinceId, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setDistrictList({ provinceId, items });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [provinceId]);

  const totals = useMemo(() => {
    const subTotal = lines.reduce(
      (acc, l) => acc + l.product.productUnitPrice * l.quantity,
      0,
    );
    const igv = Math.round(subTotal * IGV_RATE * 100) / 100;
    return { subTotal, igv, total: subTotal + igv };
  }, [lines]);

  function addLine() {
    if (!pickedProduct || pickedQty < 1) return;
    setLines((prev) => {
      const existing = prev.find(
        (l) => l.product.productId === pickedProduct.productId,
      );
      if (existing) {
        // El backend rechaza productos repetidos: se suman las cantidades.
        return prev.map((l) =>
          l.product.productId === pickedProduct.productId
            ? { ...l, quantity: l.quantity + pickedQty }
            : l,
        );
      }
      return [...prev, { product: pickedProduct, quantity: pickedQty }];
    });
    setPickedProduct(null);
    setPickedQty(1);
  }

  function updateQty(productId: string, quantity: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.product.productId === productId
          ? { ...l, quantity: Math.max(1, quantity) }
          : l,
      ),
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.productId !== productId));
  }

  const canSubmit =
    saleTypeId !== null &&
    client !== null &&
    districtId !== '' &&
    lines.length > 0 &&
    !submitting;

  async function submit() {
    if (!canSubmit || saleTypeId === null || !client) return;
    setSubmitting(true);
    setError(null);
    try {
      const sale = await api.sales.create({
        saleTypeId,
        clientId: client.clientId,
        districtId,
        saleDetails: lines.map((l) => ({
          productId: l.product.productId,
          quantity: l.quantity,
        })),
      });
      setResult(sale);
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
    setClient(null);
    setSaleTypeChoice(null);
    setDepartmentId('');
    setProvinceId('');
    setDistrictId('');
    setLines([]);
    setPickedProduct(null);
    setPickedQty(1);
    setResult(null);
    setError(null);
  }

  // --- Pantalla de exito ---------------------------------------------------
  if (result) {
    return (
      <>
        <PageHeader
          title="Venta registrada"
          subtitle="El comprobante se emitio correctamente."
        />
        <Card className="mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckIcon className="size-7" />
          </span>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Comprobante
          </p>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {result.saleNumber}
          </p>

          <dl className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800/50">
            <Row label="Subtotal" value={formatCurrency(result.subTotal)} />
            <Row label="IGV (18%)" value={formatCurrency(result.igv)} />
            <div className="border-t border-slate-200 pt-2 dark:border-slate-700">
              <Row
                label="Total"
                value={formatCurrency(result.total)}
                emphasize
              />
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Comprobante
            </p>
            <SaleDocumentActions saleId={result.saleId} />
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={resetForm}>
              <PlusIcon className="size-4" />
              Nueva venta
            </Button>
            <Link href="/ventas/buscar">
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
      <PageHeader title="Nueva venta" subtitle="Emite una boleta o factura." />

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Cliente */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <UserIcon className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              Cliente
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                {client ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {client.clientDescription}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      · Doc. {client.documentNumber}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-medium',
                        isRuc(client)
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                      )}
                    >
                      {isRuc(client) ? 'RUC' : 'Sin RUC'}
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Ningún cliente seleccionado
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setClientModalOpen(true)}
                aria-label="Buscar cliente"
                title="Buscar cliente"
                className={searchIconButtonClass}
              >
                <SearchIcon className="size-5 shrink-0" />
              </button>
            </div>
          </Card>

          {/* Tipo de comprobante */}
          <Card className="p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <ReceiptIcon className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              Tipo de comprobante
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              {!client
                ? 'Selecciona un cliente para habilitar el tipo.'
                : isRuc(client)
                  ? 'Cliente con RUC: puede emitir factura o boleta.'
                  : 'Cliente sin RUC: solo puede emitir boleta.'}
            </p>
            <div className="flex flex-wrap gap-3">
              {saleTypes.length === 0 && (
                <p className="text-sm text-slate-400">Cargando…</p>
              )}
              {saleTypes.map((type) => {
                const isFactura = type.saleTypeCode === 'FAC';
                const disabled = !client || (isFactura && !isRuc(client));
                const active = saleTypeId === type.saleTypeId;
                return (
                  <button
                    key={type.saleTypeId}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      client &&
                      setSaleTypeChoice({
                        clientId: client.clientId,
                        saleTypeId: type.saleTypeId,
                      })
                    }
                    className={cn(
                      'flex min-w-32 flex-col items-start rounded-lg border px-4 py-3 text-left transition',
                      disabled && 'cursor-not-allowed opacity-40',
                      active
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-500/10'
                        : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600',
                    )}
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {type.saleTypeDescription}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {type.saleTypeCode}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Ubicacion */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <MapPinIcon className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              Ubicacion (distrito)
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Departamento</label>
                <select
                  className={inputClass}
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setProvinceId('');
                    setDistrictId('');
                  }}
                >
                  <option value="">Seleccionar…</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentDescription}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Provincia</label>
                <select
                  className={inputClass}
                  value={provinceId}
                  onChange={(e) => {
                    setProvinceId(e.target.value);
                    setDistrictId('');
                  }}
                  disabled={!departmentId}
                >
                  <option value="">Seleccionar…</option>
                  {provinces.map((p) => (
                    <option key={p.provinceId} value={p.provinceId}>
                      {p.provinceDescription}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Distrito</label>
                <select
                  className={inputClass}
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  disabled={!provinceId}
                >
                  <option value="">Seleccionar…</option>
                  {districts.map((d) => (
                    <option key={d.districtId} value={d.districtId}>
                      {d.districtDescription}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Productos */}
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <BoxIcon className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              Productos
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className={labelClass}>Producto</label>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                    {pickedProduct ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {pickedProduct.productName}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          · {formatCurrency(pickedProduct.productUnitPrice)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Ningún producto seleccionado
                      </span>
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
              <div className="w-full sm:w-28">
                <label className={labelClass}>Cantidad</label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  className={inputClass}
                  value={pickedQty}
                  onChange={(e) =>
                    setPickedQty(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </div>
              <Button
                type="button"
                onClick={addLine}
                disabled={!pickedProduct}
                className="sm:w-auto"
              >
                <PlusIcon className="size-4" />
                Agregar
              </Button>
            </div>

            {/* Tabla de lineas */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    <th className="py-2 pr-3 font-medium">Producto</th>
                    <th className="py-2 pr-3 text-right font-medium">P. unit.</th>
                    <th className="py-2 pr-3 text-center font-medium">Cant.</th>
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
                        Aun no agregaste productos.
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
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                        {formatCurrency(l.product.productUnitPrice)}
                      </td>
                      <td className="py-2 pr-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={l.quantity}
                          onChange={(e) =>
                            updateQty(
                              l.product.productId,
                              Number(e.target.value) || 1,
                            )
                          }
                          className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-center text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                        {formatCurrency(l.product.productUnitPrice * l.quantity)}
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
                <Row
                  label="Total"
                  value={formatCurrency(totals.total)}
                  emphasize
                />
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Importes estimados. El backend recalcula con el precio vigente del
              catalogo al registrar.
            </p>

            <Button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="mt-5 w-full"
            >
              {submitting ? 'Registrando…' : 'Registrar venta'}
            </Button>

            {!canSubmit && !submitting && (
              <ul className="mt-3 space-y-1 text-xs text-slate-400 dark:text-slate-500">
                {!client && <li>· Selecciona un cliente</li>}
                {client && saleTypeId === null && (
                  <li>· Elige el tipo de comprobante</li>
                )}
                {!districtId && <li>· Completa el distrito</li>}
                {lines.length === 0 && <li>· Agrega al menos un producto</li>}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Modal: buscar cliente */}
      <PickerModal<Client>
        open={clientModalOpen}
        title="Buscar cliente"
        searchPlaceholder="Nombre o numero de documento…"
        headers={['Cliente', 'Documento', 'Tipo']}
        getKey={(c) => c.clientId}
        renderCells={(c) => [
          c.clientDescription,
          c.documentNumber,
          isRuc(c) ? 'RUC' : 'Sin RUC',
        ]}
        fetchPage={(q, page, signal) => {
          const onlyDigits = /^\d+$/.test(q);
          return api.clients.list(
            {
              clientDescription: !onlyDigits && q ? q : undefined,
              documentNumber: onlyDigits && q ? q : undefined,
              clientActive: true,
              page,
              limit: 5,
            },
            signal,
          );
        }}
        onSelect={(c) => {
          setClient(c);
          setClientModalOpen(false);
        }}
        onClose={() => setClientModalOpen(false)}
      />

      {/* Modal: buscar producto */}
      <PickerModal<Product>
        open={productModalOpen}
        title="Buscar producto"
        searchPlaceholder="Nombre del producto…"
        headers={['Producto', 'Precio']}
        getKey={(p) => p.productId}
        renderCells={(p) => [
          p.productName,
          formatCurrency(p.productUnitPrice),
        ]}
        renderDetails={(p) => <ProductDetail product={p} />}
        fetchPage={(q, page, signal) =>
          api.products.query(
            {
              productDescription: q || undefined,
              productActive: true,
              page,
              limit: 5,
            },
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

/** Detalle desplegable de un producto: imagen, descripcion y precio. */
function ProductDetail({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = Boolean(product.productImage) && !imgError;

  return (
    <div className="flex gap-4">
      <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
        {hasImage ? (
          // Imagen externa arbitraria: <img> evita configurar dominios en next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.productImage as string}
            alt={product.productName}
            className="size-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="px-2 text-center text-xs text-slate-400">
            Sin imagen
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-slate-800 dark:text-slate-100">
          {product.productName}
        </p>
        <p className="mt-0.5 font-semibold text-indigo-600 dark:text-indigo-400">
          {formatCurrency(product.productUnitPrice)}
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {product.productDescription ?? 'Sin descripcion.'}
        </p>
      </div>
    </div>
  );
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
