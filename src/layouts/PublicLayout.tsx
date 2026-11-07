import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Menu, X } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { PageLoader } from '../components/ui/primitives';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { useI18n } from '../lib/i18n';
import { useMe } from '../lib/queries';

export default function PublicLayout() {
  const { t } = useI18n();
  const { data: user } = useMe();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const links = [
    { to: '/fonctionnalites', label: t('Fonctionnalités', 'Features') },
    { to: '/a-propos', label: t('À propos', 'About') },
    { to: '/faq', label: 'FAQ' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-ink text-white">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-lime focus:px-4 focus:py-2 focus:text-black">
        {t('Aller au contenu', 'Skip to content')}
      </a>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label={t('Navigation principale', 'Main navigation')}>
          <Link to="/" aria-label="ThusStride - accueil">
            <Logo size={30} />
          </Link>
          <ul className="hidden items-center gap-7 text-sm lg:flex">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className={({ isActive }) => (isActive ? 'text-lime' : 'text-white/60 hover:text-white')}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitch />
            {user ? (
              <Link to="/app" className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-black hover:bg-white">
                {t('Mon espace', 'My space')}
              </Link>
            ) : (
              <>
                <Link to="/connexion" className="px-3 py-2 text-sm text-white/70 hover:text-white">
                  {t('Connexion', 'Sign in')}
                </Link>
                <Link to="/inscription" className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-black hover:bg-white">
                  {t('Commencer gratuitement', 'Start for free')}
                </Link>
              </>
            )}
          </div>
          <button
            className="rounded-lg p-2 text-white/70 hover:text-white lg:hidden cursor-pointer"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('Fermer le menu', 'Close menu') : t('Ouvrir le menu', 'Open menu')}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
        {open && (
          <div id="mobile-menu" className="border-t border-white/5 px-4 pb-6 pt-2 lg:hidden animate-fade-in">
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to} className="block rounded-lg px-3 py-3 text-white/80 hover:bg-white/5">
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              {user ? (
                <Link to="/app" className="rounded-lg bg-lime px-4 py-3 text-center font-semibold text-black">
                  {t('Mon espace', 'My space')}
                </Link>
              ) : (
                <>
                  <Link to="/inscription" className="rounded-lg bg-lime px-4 py-3 text-center font-semibold text-black">
                    {t('Commencer gratuitement', 'Start for free')}
                  </Link>
                  <Link to="/connexion" className="rounded-lg border border-white/10 px-4 py-3 text-center">
                    {t('Connexion', 'Sign in')}
                  </Link>
                </>
              )}
              <LanguageSwitch className="self-start mt-2" />
            </div>
          </div>
        )}
      </header>

      <main id="contenu" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-white/5 bg-panel">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size={28} />
            <p className="mt-4 max-w-sm text-sm text-white/50">
              {t(
                "Le coach de course à pied qui adapte votre entraînement à votre physiologie et à votre fatigue, pour progresser sans vous blesser.",
                'The running coach that adapts your training to your physiology and fatigue, so you improve without getting injured.',
              )}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{t('Produit', 'Product')}</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/50">
              <li><Link className="hover:text-white" to="/fonctionnalites">{t('Fonctionnalités', 'Features')}</Link></li>
              <li><Link className="hover:text-white" to="/faq">FAQ</Link></li>
              <li><Link className="hover:text-white" to="/a-propos">{t('À propos', 'About')}</Link></li>
              <li><Link className="hover:text-white" to="/inscription">{t('Créer un compte', 'Create an account')}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{t('Légal', 'Legal')}</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/50">
              <li><Link className="hover:text-white" to="/confidentialite">{t('Confidentialité', 'Privacy')}</Link></li>
              <li><Link className="hover:text-white" to="/conditions-utilisation">{t("Conditions d'utilisation", 'Terms of use')}</Link></li>
              <li><Link className="hover:text-white" to="/mentions-legales">{t('Mentions légales', 'Legal notice')}</Link></li>
              <li><Link className="hover:text-white" to="/cookies">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} ThusStride · {t('Conçu par', 'Built by')} ThusDev - Malthus Ametepe ·{' '}
          {t("Ne remplace pas un avis médical.", 'Not a substitute for medical advice.')}
        </div>
      </footer>
    </div>
  );
}
