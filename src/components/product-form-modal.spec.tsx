import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductFormModal } from './product-form-modal';
import type { Brand, Category, Product } from '@/lib/api';

vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    body: Record<string, unknown> | undefined;
    constructor(message: string, body?: Record<string, unknown>) {
      super(message);
      this.body = body;
    }
  }
  return {
    ApiError,
    api: {
      products: {
        get: vi.fn().mockResolvedValue({ stockQuantity: 5 }),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
      },
    },
  };
});

import { api } from '@/lib/api';

const BRANDS: Brand[] = [
  { brandId: 'b1', brandDescription: 'Sony', brandActive: true },
];
const CATEGORIES: Category[] = [
  { categoryId: 'c1', categoryDescription: 'Electronica', categoryActive: true },
];
const PRODUCT: Product = {
  productId: 'p1',
  brandId: 'b1',
  categoryId: 'c1',
  productName: 'TV LED 55"',
  productDescription: null,
  productImage: null,
  productUnitPrice: 1500,
  igvRate: 0.18,
  productActive: true,
};

function baseProps(overrides: Partial<Parameters<typeof ProductFormModal>[0]> = {}) {
  return {
    product: null,
    brands: BRANDS,
    categories: CATEGORIES,
    onClose: vi.fn(),
    onSaved: vi.fn(),
    ...overrides,
  };
}

describe('ProductFormModal', () => {
  beforeEach(() => {
    vi.mocked(api.products.create).mockResolvedValue({} as any);
    vi.mocked(api.products.update).mockResolvedValue({} as any);
    vi.mocked(api.products.get).mockResolvedValue({ stockQuantity: 5 } as any);
  });

  it('shows "Nuevo producto" title when creating', () => {
    render(<ProductFormModal {...baseProps()} />);
    expect(screen.getByRole('dialog', { name: 'Nuevo producto' })).toBeInTheDocument();
  });

  it('shows "Editar producto" title when editing', async () => {
    render(<ProductFormModal {...baseProps({ product: PRODUCT })} />);
    expect(screen.getByRole('dialog', { name: 'Editar producto' })).toBeInTheDocument();
  });

  it('submit button is disabled when name is empty', () => {
    render(<ProductFormModal {...baseProps()} />);
    expect(screen.getByRole('button', { name: 'Crear producto' })).toBeDisabled();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProductFormModal {...baseProps({ onClose })} />);
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProductFormModal {...baseProps({ onClose })} />);
    const backdrop = document.querySelector('.fixed.inset-0.bg-slate-900\\/50') as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProductFormModal {...baseProps({ onClose })} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls api.products.create and onSaved on valid new product submit', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<ProductFormModal {...baseProps({ onSaved })} />);

    await user.selectOptions(screen.getByLabelText('Marca'), 'b1');
    await user.selectOptions(screen.getByLabelText('Categoria'), 'c1');
    await user.type(screen.getByLabelText('Nombre'), 'Laptop Pro');
    await user.clear(screen.getByLabelText('Precio unitario (S/)'));
    await user.type(screen.getByLabelText('Precio unitario (S/)'), '999');

    const submitBtn = screen.getByRole('button', { name: 'Crear producto' });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    await waitFor(() => expect(api.products.create).toHaveBeenCalled());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('calls api.products.update on editing submit', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<ProductFormModal {...baseProps({ product: PRODUCT, onSaved })} />);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(api.products.update).toHaveBeenCalledWith(
      PRODUCT.productId,
      expect.objectContaining({ productName: PRODUCT.productName }),
    ));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('shows stock badge when editing and stock is loaded', async () => {
    render(<ProductFormModal {...baseProps({ product: PRODUCT })} />);
    await waitFor(() => expect(screen.getByText('Stock: 5')).toBeInTheDocument());
  });

  it('shows error message when API throws', async () => {
    const user = userEvent.setup();
    vi.mocked(api.products.create).mockRejectedValueOnce(
      new Error('Network error'),
    );
    render(<ProductFormModal {...baseProps()} />);

    await user.selectOptions(screen.getByLabelText('Marca'), 'b1');
    await user.selectOptions(screen.getByLabelText('Categoria'), 'c1');
    await user.type(screen.getByLabelText('Nombre'), 'Producto X');
    await user.type(screen.getByLabelText('Precio unitario (S/)'), '10');

    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    await waitFor(() =>
      expect(screen.getByText('No se pudo guardar el producto.')).toBeInTheDocument(),
    );
  });
});
