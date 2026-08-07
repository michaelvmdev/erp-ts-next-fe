# erp-ts-next-fe

Frontend en Next.js para el sistema ERP **AppSales** de **Michael Dev S.A.C.**,
conectado al backend `crud-ts-nest-be`. La aplicacion cubre CRUD de catalogos,
ventas, compras, proveedores y analitica con diagramas interactivos.

## Funcionalidades

- Dashboard con indicadores del mes (ventas, ingresos, compras, productos).
- Registro de ventas con seleccion de cliente, tipo de comprobante, ubigeo y
  productos; con calculo automatico de IGV y total.
- Busqueda de ventas por numero, tipo, cliente, fechas e importes con
  paginacion configurable, ordenamiento y modal de detalle.
- Acciones sobre comprobantes: vista previa del PDF, descarga y envio por correo.
- CRUD de proveedores con validacion de RUC empresarial.
- Registro de compras con seleccion de proveedor, productos y precio de costo.
- Busqueda de compras por proveedor, fechas e importes con paginacion configurable.
- CRUD completo de productos, marcas, categorias y clientes con paginacion,
  filtros, edicion en modal, toggle activo/inactivo y eliminacion con
  alternativa de desactivacion ante conflicto (HTTP 409).
- Diagramas de ventas: anuales (columnas) y mensuales (linea) con filtros por
  ubigeo y categoria; producto lider por mes.
- Diagramas de compras: anuales (linea) y mensuales con filtros por categoria;
  producto mas comprado por mes.
- Boton de recarga en todos los diagramas.
- Sidebar colapsable con grupos de navegacion expandibles/colapsables.
- Proxy interno `/api/*` hacia el backend para evitar exponer la URL real en
  el navegador y simplificar CORS.
- Soporte de tema claro/oscuro persistido por el sistema operativo.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Highcharts 13
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

## Rutas principales

| Ruta | Descripcion |
|---|---|
| `/` | Dashboard con indicadores del mes. |
| `/ventas/nueva` | Registrar una nueva venta. |
| `/ventas/buscar` | Buscar ventas emitidas y abrir su detalle. |
| `/compras/nueva` | Registrar una nueva compra. |
| `/compras/buscar` | Buscar compras registradas y abrir su detalle. |
| `/productos` | CRUD de productos. |
| `/marcas` | CRUD de marcas. |
| `/categorias` | CRUD de categorias. |
| `/clientes` | CRUD de clientes. |
| `/proveedores` | CRUD de proveedores. |
| `/diagramas/anual` | Ventas totales por año (columnas). |
| `/diagramas/mensual` | Ventas mensuales por año, ubigeo y categoria. |
| `/diagramas/purchases/anual` | Compras totales por año (linea). |
| `/diagramas/purchases/mensual` | Compras mensuales por año y categoria. |

## Estructura del proyecto

```text
src/
  app/
    api/[...path]/    Proxy hacia el backend (route handler)
    diagramas/
      anual/          Diagrama de ventas anuales
      mensual/        Diagramas de ventas mensuales
      purchases/
        anual/        Diagrama de compras anuales
        mensual/      Diagramas de compras mensuales
    ventas/
      nueva/          Nueva venta
      buscar/         Busqueda de ventas
    compras/
      nueva/          Nueva compra
      buscar/         Busqueda de compras
    productos/        CRUD de productos
    marcas/           CRUD de marcas
    categorias/       CRUD de categorias
    clientes/         CRUD de clientes
    proveedores/      CRUD de proveedores
  components/         Componentes reutilizables (modales, UI, iconos)
  lib/
    api/              Cliente HTTP tipado por recurso
    format.ts         Utilidades de formato (moneda, fechas)
    cn.ts             Utilidad classnames
    use-theme.ts      Hook para deteccion del tema activo
public/               Assets estaticos
```

## Contrato con el backend

Los tipos del contrato viven en `src/lib/api/types.ts` y reflejan los DTOs del
backend. Si cambia un endpoint o DTO en `crud-ts-nest-be`, actualiza primero ese
archivo y luego los clientes especificos en `src/lib/api/`.

El proxy acepta cualquier metodo HTTP definido en el route handler y conserva
la ruta original:

```text
/api/brands                               -> BACKEND_API_URL/brands
/api/products/query                       -> BACKEND_API_URL/products/query
/api/sales                                -> BACKEND_API_URL/sales
/api/sales/:id/pdf                        -> BACKEND_API_URL/sales/:id/pdf
/api/purchases                            -> BACKEND_API_URL/purchases
/api/suppliers                            -> BACKEND_API_URL/suppliers
/api/dashboard/yearly-sales               -> BACKEND_API_URL/dashboard/yearly-sales
/api/dashboard/monthly-sales              -> BACKEND_API_URL/dashboard/monthly-sales
/api/dashboard/yearly-purchases           -> BACKEND_API_URL/dashboard/yearly-purchases
/api/dashboard/monthly-purchases          -> BACKEND_API_URL/dashboard/monthly-purchases
```
