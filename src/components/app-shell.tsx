'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ComponentType } from 'react';
import { cn } from '@/lib/cn';
import { ThemeToggle } from './theme-toggle';
import {
  BoxIcon,
  ChartIcon,
  CloseIcon,
  DashboardIcon,
  MenuIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
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
  children: NavLink[];
}

type NavEntry = NavLink | NavGroup;

const nav: NavEntry[] = [
  { label: 'Dashboard', href: '/', icon: DashboardIcon },
  {
    label: 'Ventas',
    icon: ReceiptIcon,
    children: [
      { label: 'Nueva venta', href: '/ventas/nueva', icon: PlusIcon },
      { label: 'Buscar', href: '/ventas/buscar', icon: SearchIcon },
    ],
  },
  { label: 'Productos', href: '/productos', icon: BoxIcon },
  { label: 'Clientes', href: '/clientes', icon: UserIcon },
  {
    label: 'Diagramas',
    icon: ChartIcon,
    children: [{ label: 'Anual', href: '/diagramas/anual', icon: ChartIcon }],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function NavItem({
  link,
  onNavigate,
}: {
  link: NavLink;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, link.href);
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
        active
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
      )}
    >
      <Icon className="size-5 shrink-0" />
      {link.label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <ReceiptIcon className="size-5" />
        </span>
        <span className="text-base font-semibold text-slate-900 dark:text-white">
          Ventas<span className="text-indigo-600 dark:text-indigo-400">App</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((entry) =>
          'children' in entry ? (
            <div key={entry.label} className="pt-1">
              {/* Cabecera del menu (icono + nombre); los hijos van anidados. */}
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <entry.icon className="size-5 shrink-0" />
                {entry.label}
              </div>
              <div className="ml-[1.625rem] space-y-1 border-l border-slate-200 pl-2 dark:border-slate-800">
                {entry.children.map((link) => (
                  <NavItem key={link.href} link={link} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ) : (
            <NavItem key={entry.href} link={entry} onNavigate={onNavigate} />
          ),
        )}
      </nav>

      <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Sistema de ventas · v0.1
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      {/* Sidebar fijo en escritorio */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent onNavigate={close} />
        </div>
      </aside>

      {/* Drawer en movil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={close}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl dark:bg-slate-900">
            <SidebarContent onNavigate={close} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <MenuIcon className="size-5" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Boton de cierre flotante del drawer, accesible */}
      {mobileOpen && (
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar menu"
          className="fixed right-4 top-4 z-50 inline-flex size-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow lg:hidden dark:bg-slate-800 dark:text-slate-200"
        >
          <CloseIcon className="size-5" />
        </button>
      )}
    </div>
  );
}
