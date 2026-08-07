'use client';

import { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';

// Guard para no inicializar el módulo dos veces (HMR).
let mapModuleReady = false;

async function ensureMapModule() {
  if (mapModuleReady) return;
  const mod = await import('highcharts/modules/map');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (Highcharts as any).mapChart !== 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod.default as unknown as (h: typeof Highcharts) => void)(Highcharts);
  }
  mapModuleReady = true;
}

export function MapChart({ options }: { options: Highcharts.Options }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    ensureMapModule().then(() => {
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
