import { Link } from 'react-router';
import { Seo } from '../lib/seo';
import { useI18n } from '../lib/i18n';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <Seo title={t('Page introuvable | ThusStride', 'Page not found | ThusStride')} noindex />
      <p className="font-display text-7xl font-bold text-lime">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">{t('Cette page n’existe pas', 'This page does not exist')}</h1>
      <p className="mt-3 text-white/60">{t('Le lien est peut-être erroné ou la page a été déplacée.', 'The link may be wrong or the page may have moved.')}</p>
      <Link to="/" className="mt-8 rounded-lg bg-lime px-5 py-2.5 font-semibold text-black hover:bg-white">
        {t("Retour à l'accueil", 'Back to home')}
      </Link>
    </section>
  );
}
