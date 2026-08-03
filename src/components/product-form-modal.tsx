'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  api,
  type Brand,
  type Category,
  type Product,
} from '@/lib/api';
import { Button, inputClass, labelClass } from './ui';
import { CloseIcon } from './icons';

interface ProductFormModalProps {
  /** null = crear; un producto = editar. */
  product: Product | null;
  brands: Brand[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

/** Modal de alta/edicion de un producto. */
export function ProductFormModal({
  product,
  brands,
  categories,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const editing = product !== null;

  const [brandId, setBrandId] = useState(product?.brandId ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [name, setName] = useState(product?.productName ?? '');
  const [description, setDescription] = useState(product?.productDescription ?? '');
  const [image, setImage] = useState(product?.productImage ?? '');
  const [price, setPrice] = useState(
    product ? String(product.productUnitPrice) : '',
  );
  const [active, setActive] = useState(product?.productActive ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const priceNumber = Number(price);
  const valid =
    brandId !== '' &&
    categoryId !== '' &&
    name.trim() !== '' &&
    price !== '' &&
    Number.isFinite(priceNumber) &&
    priceNumber >= 0;

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const common = {
        brandId,
        categoryId,
        productName: name.trim(),
        productDescription: description.trim() || null,
        productImage: image.trim() || null,
        productUnitPrice: Math.round(priceNumber * 100) / 100,
        productActive: active,
      };
      if (editing) {
        await api.products.update(product.productId, common);
      } else {
        await api.products.create(common);
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? Array.isArray(err.body?.message)
            ? err.body.message.join(' ')
            : err.message
          : 'No se pudo guardar el producto.',
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
        aria-label={editing ? 'Editar producto' : 'Nuevo producto'}
        className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {editing ? 'Editar producto' : 'Nuevo producto'}
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

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="p-brand">
                Marca
              </label>
              <select
                id="p-brand"
                className={inputClass}
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {brands.map((b) => (
                  <option key={b.brandId} value={b.brandId}>
                    {b.brandDescription}
                    {b.brandActive ? '' : ' (inactiva)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="p-category">
                Categoria
              </label>
              <select
                id="p-category"
                className={inputClass}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryDescription}
                    {c.categoryActive ? '' : ' (inactiva)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="p-name">
              Nombre
            </label>
            <input
              id="p-name"
              type="text"
              className={inputClass}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre comercial"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="p-desc">
              Descripcion <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="p-desc"
              className={`${inputClass} min-h-20 resize-y`}
              maxLength={250}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripcion larga del producto"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="p-price">
                Precio unitario (S/)
              </label>
              <input
                id="p-price"
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-image">
                Imagen (URL) <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                id="p-image"
                type="text"
                className={inputClass}
                maxLength={500}
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Producto activo
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
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </div>
    </div>
  );
}
