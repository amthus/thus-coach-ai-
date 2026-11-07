import type { ReactNode } from 'react';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { PUBLIC_ROUTES } from '../../../shared/seo';

export const LEGAL = {
  publisher: import.meta.env.VITE_LEGAL_PUBLISHER || 'Malthus Ametepe (ThusDev)',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'contact@thusstride.app',
  host: 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis - vercel.com',
  updatedAt: '2026-11-07',
};

export function LegalPage({ path, title, children }: { path: string; title: string; children: ReactNode }) {
  const { t, locale } = useI18n();
  const seo = PUBLIC_ROUTES.find((r) => r.path === path)!;
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Seo title={seo.title} description={seo.description} />
      <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-white/40">
        {t('Dernière mise à jour :', 'Last updated:')} {new Date(LEGAL.updatedAt).toLocaleDateString(locale, { dateStyle: 'long' })}
      </p>
      <div className="prose-legal mt-8">{children}</div>
    </article>
  );
}
