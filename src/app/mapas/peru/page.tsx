'use client';

import { useEffect, useMemo, useState } from 'react';
import type Highcharts from 'highcharts';
import { MapChart } from '@/components/map-chart';
import { Card, inputClass, labelClass, PageHeader } from '@/components/ui';
import { useIsDark } from '@/lib/use-theme';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import { RefreshIcon, TagIcon } from '@/components/icons';
import { api, type Department } from '@/lib/api';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

type FilterMode = 'year' | 'range';

/** Mapeo fijo: código ubigeo de departamento (2 dígitos) → hc-key del mapa de Highcharts. */
const DEPT_TO_HCKEY: Record<string, string> = {
  '01': 'pe-am', // Amazonas
  '02': 'pe-an', // Ancash
  '03': 'pe-ap', // Apurímac
  '04': 'pe-ar', // Arequipa
  '05': 'pe-ay', // Ayacucho
  '06': 'pe-cj', // Cajamarca
  '07': 'pe-cl', // Callao
  '08': 'pe-cs', // Cusco
  '09': 'pe-hv', // Huancavelica
  '10': 'pe-hc', // Huánuco
  '11': 'pe-ic', // Ica
  '12': 'pe-ju', // Junín
  '13': 'pe-ll', // La Libertad
  '14': 'pe-lb', // Lambayeque
  '15': 'pe-lr', // Lima
  '16': 'pe-lo', // Loreto
  '17': 'pe-md', // Madre de Dios
  '18': 'pe-mq', // Moquegua
  '19': 'pe-pa', // Pasco
  '20': 'pe-pi', // Piura
  '21': 'pe-pu', // Puno
  '22': 'pe-sm', // San Martín
  '23': 'pe-ta', // Tacna
  '24': 'pe-tu', // Tumbes
  '25': 'pe-uc', // Ucayali
};

export default function MapaPeruPage() {
  const isDark = useIsDark();

  const [filterMode, setFilterMode] = useState<FilterMode>('year');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [showLabels, setShowLabels] = useState(true);

  const [topology, setTopology] = useState<object | null>(null);
  const [topoError, setTopoError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [salesData, setSalesData] = useState<{ departmentId: string; name: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga el GeoJSON de Perú una sola vez desde el CDN de Highcharts.
  useEffect(() => {
    fetch('https://code.highcharts.com/mapdata/countries/pe/pe-all.geo.json')
      .then((r) => r.json())
      .then(setTopology)
      .catch(() => setTopoError('No se pudo cargar el mapa. Verifica la conexión a internet.'));
  }, []);

  // Carga los departamentos del API una sola vez.
  useEffect(() => {
    const c = new AbortController();
    api.ubigeo.departments(c.signal)
      .then(setDepartments)
      .catch(() => {
        setLoading(false);
        setError('No se pudieron cargar los departamentos. ¿Está activo el backend?');
      });
    return () => c.abort();
  }, []);

  // Carga ventas por departamento según el filtro activo.
  useEffect(() => {
    if (departments.length === 0) return;
    if (filterMode === 'range' && (!dateFrom || !dateTo || dateFrom > dateTo)) return;

    const c = new AbortController();
    setLoading(true);
    setError(null);

    async function fetchDeptTotal(dept: Department) {
      if (filterMode === 'year') {
        const series = await api.dashboard.monthlySalesByUbigeo(
          { year, departmentId: dept.departmentId },
          c.signal,
        );
        const total = series.items.reduce((s, i) => s + Number(i.total), 0);
        return { departmentId: dept.departmentId, name: dept.departmentDescription, total };
      }

      // Modo rango: acumula meses de cada año involucrado.
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      const fromYear = fromDate.getFullYear();
      const toYear = toDate.getFullYear();
      const fromMonth = fromDate.getMonth() + 1;
      const toMonth = toDate.getMonth() + 1;
      let total = 0;

      for (let y = fromYear; y <= toYear; y++) {
        const series = await api.dashboard.monthlySalesByUbigeo(
          { year: y, departmentId: dept.departmentId },
          c.signal,
        );
        for (const item of series.items) {
          const m = item.month;
          const inRange =
            fromYear === toYear ? m >= fromMonth && m <= toMonth
            : y === fromYear ? m >= fromMonth
            : y === toYear ? m <= toMonth
            : true;
          if (inRange) total += Number(item.total);
        }
      }
      return { departmentId: dept.departmentId, name: dept.departmentDescription, total };
    }

    Promise.allSettled(departments.map(fetchDeptTotal)).then((results) => {
      if (c.signal.aborted) return;
      const data = results
        .filter(
          (r): r is PromiseFulfilledResult<{ departmentId: string; name: string; total: number }> =>
            r.status === 'fulfilled',
        )
        .map((r) => r.value);
      setSalesData(data);
      if (data.length === 0) setError('No se pudieron cargar los datos. ¿Está activo el backend?');
    }).finally(() => {
      if (!c.signal.aborted) setLoading(false);
    });

    return () => c.abort();
  }, [year, dateFrom, dateTo, filterMode, departments, refresh]);

  const textColor = isDark ? '#cbd5e1' : '#475569';

  const periodLabel =
    filterMode === 'year' ? String(year) : `${dateFrom} → ${dateTo}`;

  const options = useMemo((): Highcharts.Options => {
    const mapPoints = salesData
      .map(({ departmentId, name, total }) => ({
        'hc-key': DEPT_TO_HCKEY[departmentId] ?? '',
        name,
        value: Math.round(total * 100) / 100,
      }))
      .filter((p) => p['hc-key']);

    return {
      chart: {
        map: topology ?? undefined,
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' },
        spacing: [0, 0, 0, 0],
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: {
        enabled: true,
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'bottom',
        itemStyle: { color: textColor },
      },
      colorAxis: {
        min: 0,
        stops: [
          [0, isDark ? '#1e2d4f' : '#dbeafe'],
          [0.5, '#6366f1'],
          [1, '#312e81'],
        ],
        labels: {
          style: { color: textColor },
          formatter() {
            return `S/ ${Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 0 }).format(Number(this.value))}`;
          },
        },
      },
      exporting: {
        enabled: true,
        buttons: {
          contextButton: {
            menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadSVG'],
          },
        },
      },
      mapNavigation: {
        enabled: true,
        buttonOptions: {
          alignTo: 'spacingBox',
          align: 'left',
          verticalAlign: 'top',
          x: 8,
        },
      },
      tooltip: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter(this: any) {
          const val = (this.point?.value ?? this.value) ?? 0;
          return `<b>${this.point?.name ?? this.name}</b><br/>Ventas ${periodLabel}: ${formatCurrency(val)}`;
        },
      },
      series: [
        {
          type: 'map',
          name: `Ventas ${periodLabel}`,
          data: mapPoints,
          joinBy: 'hc-key',
          nullColor: isDark ? '#1e293b' : '#e2e8f0',
          borderColor: isDark ? '#334155' : '#94a3b8',
          borderWidth: 0.5,
          states: { hover: { brightness: 0.2 } },
          dataLabels: {
            enabled: showLabels,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter(this: any) {
              const val = this.point?.value ?? this.value ?? 0;
              if (val === 0) return '';
              if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
              if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
              return `${Math.round(val)}`;
            },
            style: {
              fontSize: '10px',
              fontWeight: 'normal',
              color: isDark ? '#e2e8f0' : '#1e293b',
              textOutline: isDark ? '2px #0f172a' : '2px #ffffff',
            },
          },
        } as Highcharts.SeriesMapOptions,
      ],
    };
  }, [topology, salesData, isDark, textColor, showLabels, periodLabel]);

  const rangeInvalid = filterMode === 'range' && dateFrom && dateTo && dateFrom > dateTo;

  return (
    <>
      <PageHeader
        title="Mapa de ventas — Perú"
        subtitle="Total de ventas por departamento según el período seleccionado."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            {/* Selector de modo */}
            <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              {(['year', 'range'] as FilterMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilterMode(m)}
                  className={cn(
                    'h-9 px-3 text-sm font-medium transition',
                    filterMode === m
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                  )}
                >
                  {m === 'year' ? 'Año' : 'Rango'}
                </button>
              ))}
            </div>

            {/* Filtro según modo */}
            {filterMode === 'year' ? (
              <div>
                <label className={labelClass} htmlFor="map-year">Año</label>
                <select
                  id="map-year"
                  className={`${inputClass} !w-auto`}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <div>
                  <label className={labelClass} htmlFor="map-from">Desde</label>
                  <input
                    id="map-from"
                    type="date"
                    className={cn(inputClass, '!w-auto', rangeInvalid && 'border-red-400')}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="map-to">Hasta</label>
                  <input
                    id="map-to"
                    type="date"
                    className={cn(inputClass, '!w-auto', rangeInvalid && 'border-red-400')}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Botón etiquetas */}
            <button
              type="button"
              onClick={() => setShowLabels((v) => !v)}
              aria-pressed={showLabels}
              title={showLabels ? 'Ocultar etiquetas' : 'Mostrar etiquetas'}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition',
                showLabels
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <TagIcon className="size-3.5" />
              Etiquetas
            </button>

            {/* Botón recargar */}
            <button
              type="button"
              onClick={() => setRefresh((r) => r + 1)}
              aria-label="Recargar"
              title="Recargar"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshIcon className="size-4" />
            </button>
          </div>
        }
      />

      <div>
        <Card className="overflow-hidden p-2">
          {topoError ? (
            <div className="flex h-[500px] items-center justify-center text-sm text-red-500">
              {topoError}
            </div>
          ) : !topology ? (
            <div className="flex h-[500px] flex-col items-center justify-center gap-3 text-slate-400">
              <span className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400" />
              <span className="text-sm">Cargando mapa…</span>
            </div>
          ) : loading ? (
            <div className="flex h-[500px] flex-col items-center justify-center gap-3 text-slate-400">
              <span className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400" />
              <span className="text-sm">Cargando datos…</span>
            </div>
          ) : error ? (
            <div className="flex h-[500px] items-center justify-center text-sm text-red-500">
              {error}
            </div>
          ) : (
            <MapChart options={options} />
          )}
        </Card>
      </div>
    </>
  );
}
