'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Button, inputClass, labelClass } from '@/components/ui';

export default function NuevaContrasenaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mismatch = confirm.length > 0 && newPassword !== confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newPassword || newPassword !== confirm) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.replace('/login'), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No se pudo restablecer la contraseña. El enlace puede haber expirado.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <p className="text-sm text-red-600 dark:text-red-400">Enlace inválido o expirado.</p>
          <Link href="/recuperar-contrasena" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            ERP MV-DEV
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Crear nueva contraseña
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {success ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-green-700 dark:text-green-400">
                Contraseña restablecida con éxito. Redirigiendo al inicio de sesión…
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-6 text-base font-semibold text-slate-900 dark:text-white">
                Nueva contraseña
              </h2>
              <form onSubmit={submit} noValidate className="space-y-4">
                <div>
                  <label className={labelClass} htmlFor="new-pass">Nueva contraseña</label>
                  <input
                    id="new-pass"
                    type="password"
                    autoComplete="new-password"
                    className={inputClass}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="confirm-pass">Confirmar contraseña</label>
                  <input
                    id="confirm-pass"
                    type="password"
                    autoComplete="new-password"
                    className={mismatch ? `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-200` : inputClass}
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  {mismatch && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">Las contraseñas no coinciden.</p>
                  )}
                </div>

                {error && (
                  <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full justify-center"
                  disabled={!newPassword || newPassword.length < 8 || newPassword !== confirm || submitting}
                >
                  {submitting ? 'Guardando…' : 'Guardar contraseña'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
