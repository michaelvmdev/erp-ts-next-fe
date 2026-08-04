# crud-ts-next-fe

Frontend en Next.js para un sistema de ventas conectado al backend
`crud-ts-nest-be`. La aplicacion cubre operaciones CRUD de catalogos,
registro y busqueda de ventas, emision de comprobantes y analitica anual.

## Funcionalidades

- Dashboard con indicadores del mes actual.
- Registro de ventas con cliente, tipo de comprobante, ubicacion y productos.
- Busqueda de ventas por numero, tipo, cliente, fechas, importes y ordenamiento.
- Acciones sobre comprobantes: ver detalle, descargar PDF y enviar por correo
  cuando el backend lo permite.
- CRUD de productos, marcas, categorias y clientes.
- Diagramas anuales con Highcharts: ventas mensuales, ventas por ubigeo,
  ventas por categoria y producto lider por mes.
- Proxy interno `/api/*` hacia el backend para evitar exponer la URL real en el
  navegador y simplificar CORS.
- Soporte de tema claro/oscuro.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Highcharts
- ESLint

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Backend `crud-ts-nest-be` ejecutandose y accesible por HTTP.

## Configuracion

1. Instala dependencias:

```bash
npm install
```

2. Crea el archivo de entorno local desde el ejemplo:

```bash
cp .env.example .env.local
```

3. Ajusta la URL del backend en `.env.local`:

```env
BACKEND_API_URL=http://localhost:3000
```

`BACKEND_API_URL` se usa solo del lado servidor en el route handler
`src/app/api/[...path]/route.ts`. El navegador llama a `/api/*` y Next.js
reenvia la solicitud al backend.

## Scripts

```bash
npm run dev      # servidor de desarrollo en http://localhost:3001
npm run build    # build de produccion
npm run start    # sirve el build en http://localhost:3001
npm run lint     # revision con ESLint
```

## Rutas Principales

- `/`: dashboard.
- `/ventas/nueva`: registrar una nueva venta.
- `/ventas/buscar`: buscar ventas emitidas y abrir su detalle.
- `/productos`: administrar productos.
- `/marcas`: administrar marcas.
- `/categorias`: administrar categorias.
- `/clientes`: administrar clientes.
- `/diagramas/anual`: ver analitica anual.
- `/demo`: pantalla de demostracion.

## Estructura Del Proyecto

```text
src/
  app/                 Rutas de Next.js y proxy API
  components/          Componentes reutilizables de UI y modales
  lib/api/             Cliente tipado para los recursos del backend
  lib/                 Utilidades compartidas
public/                Assets estaticos
```

## Contrato Con El Backend

Los tipos del contrato viven en `src/lib/api/types.ts` y reflejan los DTOs del
backend. Si cambia un endpoint o DTO en `crud-ts-nest-be`, actualiza primero ese
archivo y luego los clientes especificos en `src/lib/api/`.

El proxy acepta cualquier metodo definido en el route handler y conserva la ruta
original:

```text
/api/brands          -> BACKEND_API_URL/brands
/api/products/query  -> BACKEND_API_URL/products/query
/api/sales           -> BACKEND_API_URL/sales
```
