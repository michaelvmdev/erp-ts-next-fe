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
export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    // El MutationObserver se encarga de re-renderizar.
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {/* Antes de hidratar no se sabe el tema: se reserva el hueco sin icono. */}
      {isDark === null ? (
        <span className="size-5" />
      ) : isDark ? (
        <SunIcon className="size-5" />
      ) : (
        <MoonIcon className="size-5" />
      )}
    </button>
  );
}
