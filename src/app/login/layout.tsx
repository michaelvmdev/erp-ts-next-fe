import type { ReactNode } from 'react';

/** Login page doesn't use the main AppShell — plain wrapper. */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
