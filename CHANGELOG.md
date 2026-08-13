# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue una version simplificada de
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y el versionado del
proyecto sigue SemVer cuando aplique.

## [Unreleased]

### Added

- **Rentabilidad por producto/categoría** (`/diagramas/rentabilidad`): gráfico de columnas Highcharts con top 20 productos (ingresos vs. costo) y tabla completa con badge de margen. Filtros por rango de fechas y botón de exportación CSV.
- **Exportación CSV** en las páginas de ventas, compras, productos y clientes: botón de descarga que genera el CSV directamente desde el backend.
- **Alertas de stock** (`/inventario/alertas`): tabla de productos por debajo del stock mínimo, con codificación por severidad (rojo/naranja) según el déficit.
- **Historial de compras por usuario ecommerce** (`/usuarios-ecommerce/[id]`): página de detalle con resumen (total compras, gasto total, ticket promedio) y tabla de ventas con estado y puntuación NPS. Botón de historial en la lista de usuarios.
- **Campaña de email por segmento NPS** (`/nps/analytics`): botón "Campaña de email" que abre un modal para seleccionar segmento (promotor/pasivo/detractor) y asunto; muestra la lista de destinatarios tras confirmar.
- **Búsqueda global** en la cabecera del shell: campo de búsqueda con atajo `Ctrl+K` que busca en tiempo real en productos, clientes, proveedores y usuarios ecommerce, y navega al detalle al seleccionar un resultado.
- **Auditoría de cambios** (`/admin/audit`): tabla paginada del log de auditoría con filtros por entidad, acción, usuario y fechas; expande el payload JSON inline.

- Analitica NPS por categoria y producto:
  - `/nps/analytics` — dos graficos de columnas Highcharts con NPS por categoria y top 20 productos,
    filtro por rango de fechas y tablas con conteos de promotores/pasivos/detractores.
  - Metodo `npsApi.analytics` en `src/lib/api/nps.ts`.
  - Tipos `NpsCategoryAnalytics`, `NpsProductAnalytics`, `NpsAnalytics` y `NpsAnalyticsQuery`
    en `src/lib/api/types.ts`.
  - Entrada "Analitica" en el grupo NPS del sidebar.

- Modulo de usuarios ecommerce:
  - `/usuarios-ecommerce` — CRUD completo con tabla paginada, filtros por email/nombre/apellido/estado,
    ordenamiento configurable, modal de alta/edicion y confirmacion de baja con manejo de FK 409.
  - Cliente `usersEcommerceApi` en `src/lib/api/users-ecommerce.ts` con `list`, `get`, `create`, `update` y `delete`.
  - Tipos `UserEcommerce`, `CreateUserEcommerceRequest`, `UpdateUserEcommerceRequest` y
    `ListUsersEcommerceQuery` en `src/lib/api/types.ts`.
  - Entrada "Usuarios ecommerce" en el sidebar con icono `UserIcon`.

- Modulo NPS completo:
  - `/nps/resultados` — dashboard con score NPS global (−100 a +100), barras de
    distribucion por categoria (promotores/pasivos/detractores) y tabla paginada
    de encuestas con fecha, score, categoria y comentario.
  - `/nps/nueva` — formulario para registrar una encuesta: selector de venta
    via PickerModal, botonera de score 0–10 con codigo de colores por categoria
    (rojo/amarillo/verde) y comentario opcional.
  - `NpsIndicator` en el Dashboard: card compacta con el score y barras de
    distribucion, enlazada a `/nps/resultados`.
  - Cliente `npsApi` en `src/lib/api/nps.ts` con `score`, `list`, `get` y `create`.
  - Tipos `NpsSurvey`, `NpsScore`, `CreateNpsSurveyRequest` y `ListNpsSurveysQuery`
    en `src/lib/api/types.ts`.
  - `StarIcon` nuevo en `src/components/icons.tsx` (outline Heroicons).
  - Grupo "NPS" en el sidebar con enlaces a Resultados y Nueva encuesta.
  - Acceso rapido "NPS" en el Dashboard.

### Changed

- Referencias a `crud-ts-nest-be` actualizadas a `erp-ts-nest-be` en README,
  siguiendo el renombrado del backend.

### Added (before NPS)

- Reporte PDF de monto por proveedor en `/compras/monto-por-proveedor`:
  lista todos los proveedores del periodo con IGV y monto total de compras,
  con descarga, vista previa y envio por correo.
  Endpoint: `GET /purchases/suppliers-amount-report?from&to`.
- Reporte PDF de compras por proveedor en `/compras/compras-por-proveedor`:
  detalle de compras de un proveedor especifico (selector paginado por nombre
  o RUC) con descarga, vista previa y envio por correo.
  Endpoint: `GET /purchases/purchases-by-supplier-report?supplierId&from&to`.
- Metodos `purchasesApi.suppliersAmountReport`, `purchasesApi.sendSuppliersAmountReportEmail`,
  `purchasesApi.purchasesBySupplierReport` y `purchasesApi.sendPurchasesBySupplierReportEmail`
  en `src/lib/api/purchases.ts`.

## [0.2.0] - 2026-08-07

### Added

- Nuevo diseno visual completo: sidebar siempre oscuro (`bg-zinc-950`),
  cabecera ligera, paleta coherente en modo claro y oscuro.
- Logo SVG (`/public/erp-mv-dev-logo.svg`) y favicon personalizado.
- CRUD de marcas en `/marcas`: lista paginada con filtros, modal de
  creacion/edicion, toggle activo/inactivo y eliminacion con manejo de
  conflicto 409.
- CRUD de categorias en `/categorias`: misma estructura que marcas.
- Eliminacion de clientes en `/clientes` con confirmacion y manejo de conflicto
  409; metodo `remove` agregado a `clientsApi`.
- CRUD de proveedores en `/proveedores` con validacion de RUC.
- Registro de compras en `/compras/nueva` con seleccion de proveedor,
  productos y precio de costo; calculo de IGV y total.
- Busqueda de compras en `/compras/buscar` con filtros, paginacion,
  ordenamiento y modal de detalle.
- Dashboard ampliado: indicadores de compras del mes junto a los de ventas.
- Diagrama de ventas anuales en `/diagramas/anual` (columnas,
  `GET /dashboard/yearly-sales`).
- Diagrama de compras anuales en `/diagramas/purchases/anual` y mensual
  en `/diagramas/purchases/mensual` con filtros por categoria.
- Mapa interactivo de ventas por departamento del Peru en `/mapas/peru`
  con filtros de fecha, etiquetas de monto y gradiente de color por volumen.
- Reporte PDF de ventas en `/ventas/reporte`: vista previa en iframe,
  descarga y envio por correo. Endpoint: `GET /sales/report?from&to`.
- Reporte PDF de productos vendidos en `/ventas/productos-vendidos`:
  ordenable por monto o cantidad. Endpoint: `GET /sales/products-report?from&to&orderBy`.
- Reporte PDF de monto por cliente en `/ventas/monto-por-cliente`:
  lista todos los clientes del periodo con IGV.
  Endpoint: `GET /sales/clients-amount-report?from&to`.
- Reporte PDF de ventas por cliente en `/ventas/ventas-por-cliente`:
  selector de cliente paginado (busqueda por nombre o documento).
  Endpoint: `GET /sales/sales-by-client-report?clientId&from&to`.
- Metodos de reporte en `salesApi`: `report`, `sendReportEmail`,
  `productsReport`, `sendProductsReportEmail`, `clientsAmountReport`,
  `sendClientsAmountReportEmail`, `salesByClientReport`,
  `sendSalesByClientReportEmail`.
- Navegacion movil: barra inferior fija con tabs Dashboard / Ventas /
  Compras / Reportes / Mas; "Mas" abre drawer con navegacion completa.
- Icono `MenuIcon`, `MapPinIcon`, `ChartIcon` y variantes de chevron
  agregados en `icons.tsx`.
- Componente `PickerModal<T>` en `src/components/picker-modal.tsx`:
  modal de busqueda paginada generica, reutilizado en clientes, productos
  y proveedores.

### Changed

- Menu lateral reorganizado: grupo "Reportes" independiente con todos los
  reportes de ventas y compras; "Diagramas" con subgrupos Ventas y Compras.
- Sidebar con boton de colapso (escritorio) y pull-tab para expandir.
- Toggle de tema movido al footer del sidebar (fuera de la cabecera).
- Cabecera de escritorio sin botones; logo visible solo en movil.
- `main` con `pb-24` en movil para no quedar oculto tras la barra inferior.
- Proyecto renombrado de `crud-ts-next-fe` a `erp-ts-next-fe`.

## [0.1.0] - 2026-08-03

### Added

- Aplicacion Next.js para gestion de ventas conectada a `crud-ts-nest-be`.
- Layout principal con sidebar responsive, navegacion por modulos y tema
  claro/oscuro.
- Dashboard con indicadores mensuales y accesos rapidos.
- Flujo de nueva venta con seleccion de cliente, comprobante, ubigeo y
  productos.
- Busqueda de ventas con filtros, paginacion, ordenamiento y modal de detalle.
- Acciones de comprobante para PDF y envio por correo, delegadas al backend.
- CRUD de productos con filtros, paginacion, edicion, eliminacion y alternativa
  de desactivacion cuando existe conflicto.
- Diagramas mensuales con Highcharts para ventas mensuales, ventas por ubigeo,
  ventas por categoria y producto mas vendido por mes.
- Cliente HTTP tipado para la API y tipos compartidos del contrato backend.
- Route handler catch-all `/api/[...path]` como proxy hacia el backend.
- Configuracion de entorno mediante `.env.example`.
