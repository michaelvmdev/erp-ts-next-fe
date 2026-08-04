# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue una version simplificada de
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y el versionado del
proyecto sigue SemVer cuando aplique.

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
- Diagramas anuales con Highcharts para ventas mensuales, ventas por ubigeo,
  ventas por categoria y producto mas vendido por mes.
- Cliente HTTP tipado para la API y tipos compartidos del contrato backend.
- Route handler catch-all `/api/[...path]` como proxy hacia el backend.
- Configuracion de entorno mediante `.env.example`.
