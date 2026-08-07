'use client';

import { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';

// Guard para no inicializar los módulos dos veces (HMR).
let modulesReady = false;

// Algunos módulos de Highcharts exponen la función en .default, otros son la función directamente.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initModule(mod: any) {
  const fn = typeof mod === 'function' ? mod : typeof mod?.default === 'function' ? mod.default : null;
  if (fn) fn(Highcharts);
}

async function ensureModules() {
  if (modulesReady) return;
  const [map, exporting] = await Promise.all([
    import('highcharts/modules/map'),
    import('highcharts/modules/exporting'),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (Highcharts as any).mapChart !== 'function') initModule(map);
  initModule(exporting);
  modulesReady = true;
}

export function MapChart({ options }: { options: Highcharts.Options }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    ensureModules().then(() => {
      if (cancelled || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chartRef.current = (Highcharts as any).mapChart(containerRef.current, options);
    });

    return () => {
      cancelled = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.update(options, true, true);
  }, [options]);

  return <div ref={containerRef} className="h-[500px] w-full" />;
}
