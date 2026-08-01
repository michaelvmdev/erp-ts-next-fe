import Link from 'next/link';
import { Card, PageHeader } from '@/components/ui';
import { BoxIcon, ChartIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { currentMonthLabel } from '@/lib/format';

/**
 * Dashboard (home). Los indicadores del mes son placeholders: el usuario
 * definira mas adelante que metricas mostrar. La estructura ya queda lista.
 */

interface Indicator {
  label: string;
  hint: string;
}

const indicators: Indicator[] = [
  { label: 'Ventas del mes', hint: 'Cantidad de comprobantes' },
  { label: 'Ingresos (S/)', hint: 'Total facturado' },
  { label: 'Boletas', hint: 'Emitidas este mes' },
  { label: 'Facturas', hint: 'Emitidas este mes' },
];

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const quickActions: QuickAction[] = [
  {
    label: 'Nueva venta',
    description: 'Emitir una boleta o factura',
    href: '/ventas/nueva',
    icon: PlusIcon,
  },
  {
    label: 'Buscar ventas',
    description: 'Consultar comprobantes emitidos',
    href: '/ventas/buscar',
    icon: SearchIcon,
  },
  {
    label: 'Productos',
    description: 'Catalogo y precios',
    href: '/productos',
    icon: BoxIcon,
  },
  {
    label: 'Diagramas',
    description: 'Graficos y analitica',
    href: '/diagramas',
    icon: ChartIcon,
  },
];

export default function DashboardPage() {
  const month = currentMonthLabel();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen de ${month}`}
      />

      {/* Indicadores del mes (placeholders) */}
      <section aria-label="Indicadores del mes">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indicators.map((it) => (
            <Card key={it.label} className="p-5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {it.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-300 dark:text-slate-600">
                —
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {it.hint}
              </p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Los indicadores se conectaran cuando definas las metricas del mes.
        </p>
      </section>

      {/* Accesos rapidos */}
      <section aria-label="Accesos rapidos" className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Accesos rapidos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group">
                <Card className="flex h-full flex-col gap-3 p-5 transition group-hover:border-indigo-300 group-hover:shadow-md dark:group-hover:border-indigo-700">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {action.label}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {action.description}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
