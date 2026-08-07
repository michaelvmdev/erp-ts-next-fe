import Link from 'next/link';
import { Card, PageHeader } from '@/components/ui';
import { BoxIcon, ChartIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { MonthIndicators } from '@/components/month-indicators';
import { currentMonthLabel } from '@/lib/format';

/** Dashboard (home): indicadores del mes actual y accesos rapidos. */

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

      {/* Indicadores del mes (datos reales del backend) */}
      <section aria-label="Indicadores del mes">
        <MonthIndicators />
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
                <Card className="flex h-full flex-col gap-3 p-5 transition group-hover:border-blue-300 group-hover:shadow-md dark:group-hover:border-blue-700">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400">
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
