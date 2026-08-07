'use client';

import { useSyncExternalStore } from 'react';
import { MoonIcon, SunIcon } from './icons';

/** Avisa cada vez que cambia la clase de <html> (ahi vive el tema). */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains('dark');

// En el servidor el tema aun se desconoce (lo fija un script en el cliente):
// `null` representa ese estado y evita pintar un icono equivocado al hidratar.
const getServerSnapshot = () => null;

/**
 * Alterna entre claro y oscuro. El tema real vive en la clase `.dark` de <html>
 * (la fija un script en el layout antes de pintar, para evitar parpadeo). Aqui
 * solo se lee esa clase, se conmuta y se persiste la eleccion.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className={
        className ??
        'inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-slate-200'
      }
    >
      {isDark === null ? (
        <span className="size-4" />
      ) : isDark ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
    </button>
  );
}
