'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Button, inputClass, labelClass } from '@/components/ui';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No se pudo enviar el correo. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            ERP MV-DEV
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Recuperar contraseña
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Si el correo existe en el sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-6 text-base font-semibold text-slate-900 dark:text-white">
                Recuperar contraseña
              </h2>
              <form onSubmit={submit} noValidate className="space-y-4">
                <div>
                  <label className={labelClass} htmlFor="recover-email">Correo electrónico</label>
                  <input
                    id="recover-email"
                    type="email"
                    autoComplete="email"
                    className={inputClass}
                    placeholder="usuario@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full justify-center" disabled={!email || submitting}>
                  {submitting ? 'Enviando…' : 'Enviar enlace'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-sm text-slate-500 hover:underline dark:text-slate-400"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
