'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains('dark');
// En el servidor el tema aun se desconoce; `false` es un default seguro que se
// corrige en el primer render del cliente.
const getServerSnapshot = () => false;

/** `true` cuando el tema oscuro esta activo; se actualiza al alternarlo. */
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
