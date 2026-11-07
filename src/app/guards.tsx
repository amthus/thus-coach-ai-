import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { PageLoader } from '../components/ui/primitives';
import { useI18n } from '../lib/i18n';
import { useMe } from '../lib/queries';

/** Keeps the UI language aligned with the account preference once signed in. */
function useSyncLanguage(lang: 'fr' | 'en' | undefined) {
  const { lang: current, setLang } = useI18n();
  useEffect(() => {
    if (lang && lang !== current) setLang(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);
}

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { data: user, isLoading } = useMe();
  const location = useLocation();
  useSyncLanguage(user?.language);

  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to={`/connexion?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/app" replace />;
  // First sign-in: the athlete profile is required before anything else.
  if (!admin && !user.hasProfile && location.pathname !== '/app/bienvenue' && !location.pathname.startsWith('/app/parametres')) {
    return <Navigate to="/app/bienvenue" replace />;
  }
  return <>{children}</>;
}

/** Redirects already authenticated visitors away from login/register pages. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useMe();
  const params = new URLSearchParams(useLocation().search);
  if (isLoading) return <PageLoader />;
  if (user) {
    const next = params.get('next');
    // Only allow same-site relative redirects (no open redirect).
    const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
    return <Navigate to={safe} replace />;
  }
  return <>{children}</>;
}
