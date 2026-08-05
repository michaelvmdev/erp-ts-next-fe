# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue una version simplificada de
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y el versionado del
proyecto sigue SemVer cuando aplique.

## [Unreleased]

### Added

- CRUD de marcas en `/marcas`: lista paginada con filtros, modal de
  creacion/edicion, toggle activo/inactivo y eliminacion con manejo de
  conflicto 409 (ofrece desactivar si tiene productos vinculados).
- CRUD de categorias en `/categorias`: misma estructura que marcas; incluye
  endpoints `POST`, `PATCH` y `DELETE /categories` nuevos en el cliente API.
- Diagrama de ventas anuales en `/diagramas/anual`: grafico de columnas con
  datos de `GET /dashboard/yearly-sales`, tipo `YearlySalesPoint` agregado.
- Submenu "Mensual" en el sidebar bajo "Diagramas"; los cuatro diagramas
  mensuales (ventas totales, por ubigeo, por categoria y producto lider)
  se movieron a `/diagramas/mensual`.
- Opcion de eliminar clientes en `/clientes` con confirmacion y manejo de
  conflicto 409; metodo `remove` agregado a `clientsApi`.
- Icono `TagIcon` (marcas), `FolderIcon` (categorias) en `icons.tsx`.
- Tipos `CreateCategoryRequest` y `UpdateCategoryRequest` en `types.ts`.

### Changed

- `/diagramas/anual` ahora muestra el grafico anual en lugar de los
  diagramas mensuales, que se trasladaron a `/diagramas/mensual`.
- Sidebar actualizado: Marcas y Categorias como items directos; Diagramas
  con dos submenus (Anual y Mensual).

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
- CRUD de marcas, categorias y clientes.
- Diagramas mensuales con Highcharts para ventas mensuales, ventas por ubigeo,
  ventas por categoria y producto mas vendido por mes.
- Cliente HTTP tipado para la API y tipos compartidos del contrato backend.
- Route handler catch-all `/api/[...path]` como proxy hacia el backend.
- Configuracion de entorno mediante `.env.example`.
