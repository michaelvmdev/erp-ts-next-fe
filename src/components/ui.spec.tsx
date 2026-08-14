import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Card, PageHeader } from './ui';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Enviar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick handler', async () => {
    const user = userEvent.setup();
    let called = false;
    render(<Button onClick={() => { called = true; }}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(called).toBe(true);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    let called = false;
    render(<Button disabled onClick={() => { called = true; }}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(called).toBe(false);
  });

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Sec</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border-slate-300');
  });

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Del</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-red-600');
  });
});

describe('Card', () => {
  it('renders children', () => {
    render(<Card><span>Contenido</span></Card>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('accepts extra className', () => {
    const { container } = render(<Card className="p-4">X</Card>);
    expect(container.firstChild).toHaveClass('p-4');
  });
});

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Productos" />);
    expect(screen.getByRole('heading', { name: 'Productos' })).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Ventas" subtitle="Resumen mensual" />);
    expect(screen.getByText('Resumen mensual')).toBeInTheDocument();
  });

  it('renders actions slot', () => {
    render(<PageHeader title="T" actions={<button>Nueva venta</button>} />);
    expect(screen.getByRole('button', { name: 'Nueva venta' })).toBeInTheDocument();
  });
});
