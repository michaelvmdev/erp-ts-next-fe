import { Card, PageHeader } from '@/components/ui';

/** Placeholder consistente para secciones aun no implementadas. */
export function ComingSoon({
  title,
  subtitle,
  note,
}: {
  title: string;
  subtitle?: string;
  note?: string;
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          En construccion
        </span>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {note ?? 'Esta seccion estara disponible pronto.'}
        </p>
      </Card>
    </>
  );
}
