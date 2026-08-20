import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientFormModal } from './client-form-modal';
import type { Client, DocumentType } from '@/lib/api';

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
      clients: {
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
      },
    },
  };
});

import { api } from '@/lib/api';

const DOC_TYPES: DocumentType[] = [
  { documentTypeId: 1, documentTypeDescription: 'DNI' },
  { documentTypeId: 2, documentTypeDescription: 'RUC' },
];

const CLIENT: Client = {
  clientId: 'cl1',
  clientDescription: 'Comercial Santa Rosa S.A.C.',
  documentTypeId: 2,
  documentNumber: '20123456789',
  clientActive: true,
};

function baseProps(overrides: Partial<Parameters<typeof ClientFormModal>[0]> = {}) {
  return {
    client: null,
    documentTypes: DOC_TYPES,
    onClose: vi.fn(),
    onSaved: vi.fn(),
    ...overrides,
  };
}

describe('ClientFormModal', () => {
  beforeEach(() => {
    vi.mocked(api.clients.create).mockResolvedValue({} as any);
    vi.mocked(api.clients.update).mockResolvedValue({} as any);
  });

  it('shows "Nuevo cliente" title when creating', () => {
    render(<ClientFormModal {...baseProps()} />);
    expect(screen.getByRole('dialog', { name: 'Nuevo cliente' })).toBeInTheDocument();
  });

  it('shows "Editar cliente" title when editing', () => {
    render(<ClientFormModal {...baseProps({ client: CLIENT })} />);
    expect(screen.getByRole('dialog', { name: 'Editar cliente' })).toBeInTheDocument();
  });

  it('submit button is disabled when name is empty', () => {
    render(<ClientFormModal {...baseProps()} />);
    expect(screen.getByRole('button', { name: 'Crear cliente' })).toBeDisabled();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ClientFormModal {...baseProps({ onClose })} />);
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows validation hint when DNI has wrong number of digits', async () => {
    const user = userEvent.setup();
    render(<ClientFormModal {...baseProps()} />);
    await user.selectOptions(screen.getByLabelText('Tipo de documento'), '1');
    await user.type(screen.getByLabelText('N° documento'), '1234567');
    expect(screen.getByText('Debe tener 8 digitos.')).toBeInTheDocument();
  });

  it('does not show validation hint when DNI has exactly 8 digits', async () => {
    const user = userEvent.setup();
    render(<ClientFormModal {...baseProps()} />);
    await user.selectOptions(screen.getByLabelText('Tipo de documento'), '1');
    await user.type(screen.getByLabelText('N° documento'), '12345678');
    expect(screen.queryByText('Debe tener 8 digitos.')).not.toBeInTheDocument();
  });

  it('shows validation hint when RUC has wrong number of digits', async () => {
    const user = userEvent.setup();
    render(<ClientFormModal {...baseProps()} />);
    await user.selectOptions(screen.getByLabelText('Tipo de documento'), '2');
    await user.type(screen.getByLabelText('N° documento'), '2012345');
    expect(screen.getByText('Debe tener 11 digitos.')).toBeInTheDocument();
  });

  it('submit button enabled with valid DNI data', async () => {
    const user = userEvent.setup();
    render(<ClientFormModal {...baseProps()} />);
    await user.type(screen.getByLabelText('Razon social / Nombre completo'), 'Juan Perez');
    await user.selectOptions(screen.getByLabelText('Tipo de documento'), '1');
    await user.type(screen.getByLabelText('N° documento'), '12345678');
    expect(screen.getByRole('button', { name: 'Crear cliente' })).not.toBeDisabled();
  });

  it('calls api.clients.create and onSaved on valid submit', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<ClientFormModal {...baseProps({ onSaved })} />);
    await user.type(screen.getByLabelText('Razon social / Nombre completo'), 'Empresa SAC');
    await user.selectOptions(screen.getByLabelText('Tipo de documento'), '2');
    await user.type(screen.getByLabelText('N° documento'), '20123456789');

    await user.click(screen.getByRole('button', { name: 'Crear cliente' }));

    await waitFor(() => expect(api.clients.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientDescription: 'Empresa SAC',
        documentTypeId: 2,
        documentNumber: '20123456789',
      }),
    ));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('calls api.clients.update on editing submit', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<ClientFormModal {...baseProps({ client: CLIENT, onSaved })} />);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(api.clients.update).toHaveBeenCalledWith(
      CLIENT.clientId,
      expect.objectContaining({ clientDescription: CLIENT.clientDescription }),
    ));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('shows error message when API fails', async () => {
    const user = userEvent.setup();
    vi.mocked(api.clients.create).mockRejectedValueOnce(new Error('Network error'));
    render(<ClientFormModal {...baseProps()} />);
    await user.type(screen.getByLabelText('Razon social / Nombre completo'), 'Test SA');
    await user.selectOptions(screen.getByLabelText('Tipo de documento'), '1');
    await user.type(screen.getByLabelText('N° documento'), '12345678');

    await user.click(screen.getByRole('button', { name: 'Crear cliente' }));

    await waitFor(() =>
      expect(screen.getByText('No se pudo guardar el cliente.')).toBeInTheDocument(),
    );
  });
});
