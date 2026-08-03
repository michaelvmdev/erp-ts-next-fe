'use client';

import { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';

/**
 * Envoltorio minimo de Highcharts (sin el wrapper oficial, para no arrastrar
 * dependencias con peer deps de React). Crea el grafico una vez y lo actualiza
 * cuando cambian las opciones.
 */
export function LineChart({ options }: { options: Highcharts.Options }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Highcharts.Chart | null>(null);

  // Crear una sola vez.
  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = Highcharts.chart(containerRef.current, options);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // Solo al montar: las actualizaciones van por el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar en cada cambio de opciones (datos, tema, filtros).
  useEffect(() => {
    // `true, true`: redibuja y reemplaza por completo (evita series residuales).
    chartRef.current?.update(options, true, true);
  }, [options]);

  return <div ref={containerRef} className="h-80 w-full" />;
}
