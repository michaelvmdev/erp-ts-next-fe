'use client';

import { useAuth } from '@/contexts/auth';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || !allowedRoles.includes(user.roleName)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-4xl">🔒</p>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Acceso no autorizado</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No tienes permiso para ver esta sección.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
