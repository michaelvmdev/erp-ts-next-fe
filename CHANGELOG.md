# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-14

### Added

#### Security — RBAC Frontend
- `RoleGuard` component (`src/components/role-guard.tsx`): client-side access control that renders an "Acceso no autorizado" message for users whose role is not in `allowedRoles`.
- Admin pages wrapped with `<RoleGuard>`:
  - `/admin/users` → `administrador`
  - `/admin/audit` → `administrador`
  - `/admin/units` → `administrador`, `almacenero`
  - `/admin/warehouses` → `administrador`, `almacenero`
  - `/admin/price-lists` → `administrador`, `almacenero`, `contador`
  - `/admin/price-lists/[id]` → `administrador`, `almacenero`, `contador`

#### Navigation
- Sidebar nav entries filtered by the current user's role (`filterNavByRole`): items with a `roles` property are hidden if the user's role is not in the list.
- Role-restricted nav entries: Pagos (administrador/contador), NPS (administrador/vendedor), Usuarios ecommerce (administrador), and individual Administración sub-items per RBAC policy.
- `UserItem` interface now includes `roleName: string` (returned by `GET /auth/me`).

### Changed
- Version label in sidebar footer updated from `v0.1` to `v1.0`.
- `SidebarContent` accepts `roleName` prop used for nav filtering.

## [0.1.0] - 2026-01-01

### Added
- Initial project scaffold (Next.js 15 App Router + TypeScript + Tailwind CSS).
- Auth flow: login, logout, token refresh, `AuthProvider` context.
- App shell with collapsible sidebar, mobile bottom nav, global search.
- Modules: Sales, Purchases, Purchase Orders, Warehouses, Units, Price Lists, Payments, NPS, Dashboard, Clients, Suppliers, Products, Inventory, Users (admin), Audit, E-commerce users, Maps, Charts.
- Dark/light theme toggle.
- Stock alert SSE bell.
