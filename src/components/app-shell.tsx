'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/contexts/auth';
import { api, type SearchResult } from '@/lib/api';
import { ThemeToggle } from './theme-toggle';
import {
  BellIcon,
  BoxIcon,
  ChartIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DashboardIcon,
  DocumentTextIcon,
  FolderIcon,
  HistoryIcon,
  MapPinIcon,
  MenuIcon,
  PowerIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
  TruckIcon,
  UserIcon,
} from './icons';

type IconType = ComponentType<{ className?: string }>;

interface NavLink {
  label: string;
  href: string;
  icon: IconType;
  roles?: string[];
}

interface NavGroup {
  label: string;
  icon: IconType;
  children: Array<NavLink | NavGroup>;
  roles?: string[];
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

function canAccess(entry: NavLink | NavGroup, roleName: string): boolean {
  if (!entry.roles) return true;
  return entry.roles.includes(roleName);
}

function filterNavByRole(entries: NavEntry[], roleName: string): NavEntry[] {
  return entries
    .filter((e) => canAccess(e, roleName))
    .map((e) => {
      if (!isNavGroup(e)) return e;
      const children = e.children.filter((c) => canAccess(c, roleName));
      return { ...e, children };
    })
    .filter((e) => !isNavGroup(e) || e.children.length > 0);
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
      { label: 'Notas de crédito', href: '/credit-notes', icon: ReceiptIcon },
    ],
  },
  {
    label: 'Almacén',
    icon: BoxIcon,
    children: [
      { label: 'Productos', href: '/productos', icon: BoxIcon },
      { label: 'Marcas', href: '/marcas', icon: TagIcon },
      { label: 'Categorías', href: '/categorias', icon: FolderIcon },
      { label: 'Inventario', href: '/inventory', icon: BoxIcon },
      { label: 'Alertas de stock', href: '/inventario/alertas', icon: BellIcon },
    ],
  },
  {
    label: 'Compras',
    icon: TruckIcon,
    children: [
      { label: 'Nueva compra', href: '/compras/nueva', icon: PlusIcon },
      { label: 'Buscar', href: '/compras/buscar', icon: SearchIcon },
      { label: 'Proveedores', href: '/proveedores', icon: TruckIcon },
      { label: 'Órdenes de compra', href: '/purchase-orders', icon: DocumentTextIcon },
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
      { label: 'Monto x proveedor', href: '/compras/monto-por-proveedor', icon: DocumentTextIcon },
      { label: 'Compras x proveedor', href: '/compras/compras-por-proveedor', icon: DocumentTextIcon },
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
      { label: 'Rentabilidad', href: '/diagramas/rentabilidad', icon: ChartIcon },
      { label: 'Comparativa', href: '/diagramas/comparativa', icon: ChartIcon },
    ],
  },
  { label: 'Pagos', href: '/payments', icon: ReceiptIcon, roles: ['administrador', 'contador'] },
  {
    label: 'NPS',
    icon: StarIcon,
    roles: ['administrador', 'vendedor'],
    children: [
      { label: 'Resultados', href: '/nps/resultados', icon: ChartIcon },
      { label: 'Analítica', href: '/nps/analytics', icon: ChartIcon },
      { label: 'Nueva encuesta', href: '/nps/nueva', icon: PlusIcon },
    ],
  },
  { label: 'Usuarios ecommerce', href: '/usuarios-ecommerce', icon: UserIcon, roles: ['administrador'] },
  {
    label: 'Administración',
    icon: SettingsIcon,
    children: [
      { label: 'Usuarios', href: '/admin/users', icon: UserIcon, roles: ['administrador'] },
      { label: 'Unidades de medida', href: '/admin/units', icon: SettingsIcon, roles: ['administrador', 'almacenero'] },
      { label: 'Almacenes', href: '/admin/warehouses', icon: BoxIcon, roles: ['administrador', 'almacenero'] },
      { label: 'Listas de precio', href: '/admin/price-lists', icon: TagIcon, roles: ['administrador', 'almacenero', 'contador'] },
      { label: 'Auditoría', href: '/admin/audit', icon: ShieldIcon, roles: ['administrador'] },
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
    isActive: (p: string) =>
      (p.startsWith('/compras') &&
        !p.startsWith('/compras/monto-por-proveedor') &&
        !p.startsWith('/compras/compras-por-proveedor')) ||
      p === '/proveedores',
    href: '/compras/nueva',
  },
  {
    label: 'Reportes',
    icon: DocumentTextIcon,
    isActive: (p: string) =>
      p.startsWith('/ventas/reporte') ||
      p.startsWith('/ventas/productos-vendidos') ||
      p.startsWith('/ventas/monto-por-cliente') ||
      p.startsWith('/ventas/ventas-por-cliente') ||
      p.startsWith('/compras/monto-por-proveedor') ||
      p.startsWith('/compras/compras-por-proveedor'),
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
  userName,
  roleName,
  onLogout,
}: {
  onNavigate: () => void;
  onCollapse?: () => void;
  onClose?: () => void;
  userName?: string;
  roleName?: string;
  onLogout?: () => void;
}) {
  const visibleNav = filterNavByRole(nav, roleName ?? '');

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
        {visibleNav.map((entry) =>
          isNavGroup(entry) ? (
            <NavGroupItem key={entry.label} group={entry} onNavigate={onNavigate} />
          ) : (
            <NavItem key={entry.href} link={entry} onNavigate={onNavigate} />
          ),
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-zinc-800 px-3 py-3 space-y-2">
        {userName && (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-zinc-400 font-medium">{userName}</span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className={sidebarIconBtn}
              >
                <PowerIcon className="size-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-zinc-600">Michael Dev S.A.C. · v1.0</span>
          <ThemeToggle className={sidebarIconBtn} />
        </div>
      </div>
    </div>
  );
}

// ─── Búsqueda global ──────────────────────────────────────────────────────────

const RESULT_TYPE_LABEL: Record<SearchResult['type'], string> = {
  product: 'Producto',
  client: 'Cliente',
  supplier: 'Proveedor',
  user_ecommerce: 'Usuario e-com.',
};

const RESULT_TYPE_HREF: Record<SearchResult['type'], (id: string) => string> = {
  product: () => '/productos',
  client: () => '/clientes',
  supplier: () => '/proveedores',
  user_ecommerce: (id) => `/usuarios-ecommerce/${id}`,
};

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQ(''); setResults([]); }
  }, [open]);

  const runSearch = useCallback((term: string) => {
    if (term.length < 2) { setResults([]); return; }
    const c = new AbortController();
    setSearching(true);
    api.search.search(term, c.signal)
      .then((r) => setResults(r))
      .catch(() => {})
      .finally(() => setSearching(false));
    return () => c.abort();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(q), 300);
    return () => clearTimeout(timer);
  }, [q, runSearch]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function handleSelect(r: SearchResult) {
    router.push(RESULT_TYPE_HREF[r.type](r.id));
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Búsqueda global"
        title="Búsqueda global (Ctrl+K)"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Buscar…</span>
        <kbd className="hidden rounded bg-slate-200 px-1 text-xs text-slate-400 dark:bg-zinc-700 dark:text-zinc-500 sm:inline">
          Ctrl+K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <SearchIcon className="size-5 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar productos, clientes, proveedores…"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-white"
              />
              {searching && (
                <div className="size-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
              )}
            </div>

            {results.length > 0 && (
              <ul className="max-h-80 overflow-y-auto py-2">
                {results.map((r) => (
                  <li key={`${r.type}:${r.id}`}>
                    <button
                      onClick={() => handleSelect(r)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        {RESULT_TYPE_LABEL[r.type]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                          {r.label}
                        </span>
                        {r.detail && (
                          <span className="block truncate text-xs text-slate-400">{r.detail}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {q.length >= 2 && !searching && results.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Sin resultados para &ldquo;{q}&rdquo;
              </p>
            )}

            {q.length < 2 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Escribe al menos 2 caracteres para buscar
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── SSE stock alerts ─────────────────────────────────────────────────────────

function useStockAlertCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '/api').replace(/\/$/, '');
    const es = new EventSource(`${API_BASE}/stock/alerts/stream?token=${encodeURIComponent(token)}`);

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const alerts = JSON.parse(e.data) as unknown[];
        setCount(Array.isArray(alerts) ? alerts.length : 0);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  return count;
}

function AlertsBell() {
  const router = useRouter();
  const count = useStockAlertCount();

  return (
    <button
      type="button"
      onClick={() => router.push('/inventario/alertas')}
      aria-label={count > 0 ? `${count} alertas de stock` : 'Alertas de stock'}
      className="relative inline-flex size-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      <BellIcon className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

// ─── Shell principal ──────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const close = () => setMobileOpen(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (loading || pathname === '/login') return;
    if (!user && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace('/login');
    }
  }, [loading, user, pathname, router]);

  // Login page: bypass shell entirely
  if (pathname === '/login') return <>{children}</>;

  // Verifying token or redirecting to login — show a centered spinner
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="size-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 dark:border-zinc-800 dark:border-t-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      {/* Sidebar fijo — escritorio */}
      {!sidebarCollapsed && (
        <aside className="hidden w-60 shrink-0 border-r border-zinc-800 bg-zinc-950 lg:block">
          <div className="sticky top-0 h-screen">
            <SidebarContent
              onNavigate={close}
              onCollapse={() => setSidebarCollapsed(true)}
              userName={user?.name}
              roleName={user?.roleName}
              onLogout={logout}
            />
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
            <SidebarContent onNavigate={close} onClose={close} userName={user?.name} roleName={user?.roleName} onLogout={logout} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabecera */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 dark:border-zinc-800 dark:bg-slate-900 sm:px-6">
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
          <div className="ml-auto flex items-center gap-2">
            <AlertsBell />
            <GlobalSearch />
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
