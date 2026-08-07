'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ComponentType } from 'react';
import { cn } from '@/lib/cn';
import { ThemeToggle } from './theme-toggle';
import {
  BoxIcon,
  ChartIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DashboardIcon,
  DocumentTextIcon,
  FolderIcon,
  MapPinIcon,
  MenuIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  TagIcon,
  TruckIcon,
  UserIcon,
} from './icons';

type IconType = ComponentType<{ className?: string }>;

interface NavLink {
  label: string;
  href: string;
  icon: IconType;
}

interface NavGroup {
  label: string;
  icon: IconType;
  children: Array<NavLink | NavGroup>;
}

type NavEntry = NavLink | NavGroup;

function isNavGroup(entry: NavLink | NavGroup): entry is NavGroup {
  return 'children' in entry;
}

function groupContainsActive(group: NavGroup, pathname: string): boolean {
  return group.children.some((child) =>
    isNavGroup(child)
      ? groupContainsActive(child, pathname)
      : child.href === '/' ? pathname === '/' : pathname.startsWith(child.href),
  );
}

const nav: NavEntry[] = [
  { label: 'Dashboard', href: '/', icon: DashboardIcon },
  {
    label: 'Ventas',
    icon: ReceiptIcon,
    children: [
      { label: 'Nueva venta', href: '/ventas/nueva', icon: PlusIcon },
      { label: 'Buscar', href: '/ventas/buscar', icon: SearchIcon },
      { label: 'Clientes', href: '/clientes', icon: UserIcon },
    ],
  },
  {
    label: 'Almacén',
    icon: BoxIcon,
    children: [
      { label: 'Productos', href: '/productos', icon: BoxIcon },
      { label: 'Marcas', href: '/marcas', icon: TagIcon },
      { label: 'Categorías', href: '/categorias', icon: FolderIcon },
    ],
  },
  {
    label: 'Compras',
    icon: TruckIcon,
    children: [
      { label: 'Nueva compra', href: '/compras/nueva', icon: PlusIcon },
      { label: 'Buscar', href: '/compras/buscar', icon: SearchIcon },
      { label: 'Proveedores', href: '/proveedores', icon: TruckIcon },
    ],
  },
  {
    label: 'Reportes',
    icon: DocumentTextIcon,
    children: [
      { label: 'Ventas', href: '/ventas/reporte', icon: DocumentTextIcon },
      { label: 'Prods. vendidos', href: '/ventas/productos-vendidos', icon: DocumentTextIcon },
      { label: 'Monto x cliente', href: '/ventas/monto-por-cliente', icon: DocumentTextIcon },
      { label: 'Ventas x cliente', href: '/ventas/ventas-por-cliente', icon: DocumentTextIcon },
    ],
  },
  {
    label: 'Mapas',
    icon: MapPinIcon,
    children: [
      { label: 'Perú', href: '/mapas/peru', icon: MapPinIcon },
    ],
  },
  {
    label: 'Diagramas',
    icon: ChartIcon,
    children: [
      {
        label: 'Ventas',
        icon: ChartIcon,
        children: [
          { label: 'Anual', href: '/diagramas/anual', icon: ChartIcon },
          { label: 'Mensual', href: '/diagramas/mensual', icon: ChartIcon },
        ],
      },
      {
        label: 'Compras',
        icon: ChartIcon,
        children: [
          { label: 'Anual', href: '/diagramas/purchases/anual', icon: ChartIcon },
          { label: 'Mensual', href: '/diagramas/purchases/mensual', icon: ChartIcon },
        ],
      },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function NavItem({ link, onNavigate }: { link: NavLink; onNavigate: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, link.href);
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-blue-500/10 text-blue-400'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
      )}
    >
      <Icon className="size-4 shrink-0" />
      {link.label}
    </Link>
  );
}

function SubGroupItem({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => groupContainsActive(group, pathname));

  useEffect(() => {
    if (groupContainsActive(group, pathname)) setOpen(true);
  }, [pathname]);

  return (
    <div className="pt-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-300"
      >
        {group.label}
        <ChevronDownIcon className={cn('size-3 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-2 space-y-0.5 border-l border-zinc-800 pl-2">
          {group.children.map((link) => (
            <NavItem key={(link as NavLink).href} link={link as NavLink} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavGroupItem({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => groupContainsActive(group, pathname));
  const Icon = group.icon;

  useEffect(() => {
    if (groupContainsActive(group, pathname)) setOpen(true);
  }, [pathname]);

  return (
    <div className="pt-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDownIcon className={cn('size-4 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-[1.375rem] space-y-0.5 border-l border-zinc-800 pl-2.5">
          {group.children.map((child) =>
            isNavGroup(child) ? (
              <SubGroupItem key={child.label} group={child} onNavigate={onNavigate} />
            ) : (
              <NavItem key={child.href} link={child} onNavigate={onNavigate} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ─── Barra de navegación inferior — solo móvil ────────────────────────────────

const BOTTOM_TABS = [
  {
    label: 'Dashboard',
    icon: DashboardIcon,
    isActive: (p: string) => p === '/',
    href: '/',
  },
  {
    label: 'Ventas',
    icon: ReceiptIcon,
    isActive: (p: string) =>
      (p.startsWith('/ventas') &&
        !p.startsWith('/ventas/reporte') &&
        !p.startsWith('/ventas/productos-vendidos') &&
        !p.startsWith('/ventas/monto-por-cliente') &&
        !p.startsWith('/ventas/ventas-por-cliente')) ||
      p === '/clientes',
    href: '/ventas/nueva',
  },
  {
    label: 'Compras',
    icon: TruckIcon,
    isActive: (p: string) => p.startsWith('/compras') || p === '/proveedores',
    href: '/compras/nueva',
  },
  {
    label: 'Reportes',
    icon: DocumentTextIcon,
    isActive: (p: string) =>
      p.startsWith('/ventas/reporte') ||
      p.startsWith('/ventas/productos-vendidos') ||
      p.startsWith('/ventas/monto-por-cliente') ||
      p.startsWith('/ventas/ventas-por-cliente'),
    href: '/ventas/reporte',
  },
] as const;

function MobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const isMas = BOTTOM_TABS.every((t) => !t.isActive(pathname));

  const tabCls = (active: boolean) =>
    cn(
      'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium leading-none transition-colors',
      active ? 'text-blue-400' : 'text-slate-400 dark:text-zinc-500',
    );

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:hidden"
    >
      {BOTTOM_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive(pathname);
        return (
          <Link key={tab.label} href={tab.href} className={tabCls(active)}>
            <Icon className="size-5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      <button type="button" onClick={onOpenMenu} className={tabCls(isMas)}>
        <MenuIcon className="size-5" />
        <span>Más</span>
      </button>
    </nav>
  );
}

// ─── Sidebar (escritorio + drawer móvil) ─────────────────────────────────────

const sidebarIconBtn =
  'inline-flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200';

function SidebarContent({
  onNavigate,
  onCollapse,
  onClose,
}: {
  onNavigate: () => void;
  onCollapse?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Marca */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-800 px-4">
        <Image src="/erp-mv-dev-logo.svg" alt="ERP MV-DEV" width={32} height={32} className="shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500 leading-none">ERP</p>
          <p className="text-sm font-semibold leading-tight text-white">
            MV<span className="text-blue-400">-DEV</span>
          </p>
        </div>
        {onCollapse && (
          <button type="button" onClick={onCollapse} aria-label="Ocultar menú" className={sidebarIconBtn}>
            <ChevronLeftIcon className="size-4" />
          </button>
        )}
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Cerrar menú" className={sidebarIconBtn}>
            <CloseIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {nav.map((entry) =>
          isNavGroup(entry) ? (
            <NavGroupItem key={entry.label} group={entry} onNavigate={onNavigate} />
          ) : (
            <NavItem key={entry.href} link={entry} onNavigate={onNavigate} />
          ),
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-zinc-800 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-zinc-600">Michael Dev S.A.C. · v0.1</span>
          <ThemeToggle className={sidebarIconBtn} />
        </div>
      </div>
    </div>
  );
}

// ─── Shell principal ──────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      {/* Sidebar fijo — escritorio */}
      {!sidebarCollapsed && (
        <aside className="hidden w-60 shrink-0 border-r border-zinc-800 bg-zinc-950 lg:block">
          <div className="sticky top-0 h-screen">
            <SidebarContent onNavigate={close} onCollapse={() => setSidebarCollapsed(true)} />
          </div>
        </aside>
      )}

      {/* Pull-tab expandir — escritorio colapsado */}
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Mostrar menú"
          className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center justify-center rounded-r-lg bg-zinc-900 px-1 py-3 text-zinc-400 shadow-lg ring-1 ring-zinc-700 transition hover:bg-zinc-800 hover:text-white lg:flex"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      )}

      {/* Drawer completo — móvil (se abre desde "Más") */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="absolute inset-y-0 left-0 w-72 bg-zinc-950 shadow-2xl">
            <SidebarContent onNavigate={close} onClose={close} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabecera */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-200 bg-white px-4 dark:border-zinc-800 dark:bg-slate-900 sm:px-6">
          {/* Logo visible solo en móvil */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <Image src="/erp-mv-dev-logo.svg" alt="ERP MV-DEV" width={28} height={28} className="shrink-0 rounded-md" />
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-400 leading-none">ERP</p>
              <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">
                MV<span className="text-blue-500">-DEV</span>
              </p>
            </div>
          </div>
        </header>

        {/* Contenido principal — padding inferior extra en móvil para la bottom nav */}
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Barra de navegación inferior — solo móvil */}
      <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />
    </div>
  );
}
