import type { ReactNode } from 'react';
import { LogoMark } from '../../components/ui/Logo';

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-20">
      <div className="rounded-2xl border border-white/10 bg-panel p-6 sm:p-8">
        <LogoMark size={40} />
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-white/50">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-white/50">{footer}</div>}
    </div>
  );
}

/** Maps API validation codes to human-readable messages. */
export function passwordErrorText(code: string | undefined, t: (fr: string, en: string) => string) {
  if (!code) return undefined;
  if (code.includes('password_too_short')) return t('Au moins 10 caractères.', 'At least 10 characters.');
  if (code.includes('password_too_weak')) return t('Doit contenir au moins une lettre et un chiffre.', 'Must contain at least one letter and one digit.');
  return t('Mot de passe invalide.', 'Invalid password.');
}
