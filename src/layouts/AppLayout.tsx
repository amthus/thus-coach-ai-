import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Activity,
  Bell,
  BookOpen,
  Calculator,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { PageLoader } from '../components/ui/primitives';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { useI18n } from '../lib/i18n';
import { useDailyReminder, useNotifications } from '../lib/notifications';
import { useActivePlan, useLogout, useMe, useWorkouts } from '../lib/queries';
import { completedMap, nextSession } from '../lib/training';

export default function AppLayout() {
  const { t, lang } = useI18n();
  const { data: user } = useMe();
  const { data: plan } = useActivePlan();
  const { data: workouts } = useWorkouts();
  const logout = useLogout();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const notifications = useNotifications(user, plan, workouts, lang);
  const next = nextSession(plan, completedMap(workouts, plan?.id));
  useDailyReminder(
    user,
    next ? `${next.session.day} - ${next.session.title} (${next.session.durationMinutes} min)` : null,
    t("Rappel d'entraînement ThusStride", 'ThusStride training reminder'),
  );

  useEffect(() => setBellOpen(false), [pathname]);
  useEffect(() => {
    if (!bellOpen) return;
    const onDoc = (e: MouseEvent) => !bellRef.current?.contains(e.target as Node) && setBellOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBellOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [bellOpen]);

  const nav = [
    { to: '/app', end: true, icon: LayoutDashboard, label: t('Tableau de bord', 'Dashboard'), short: t('Accueil', 'Home') },
    { to: '/app/plan', icon: CalendarDays, label: t('Mon plan', 'My plan'), short: 'Plan' },
    { to: '/app/coach', icon: MessageSquare, label: t('Coach IA', 'AI coach'), short: 'Coach' },
    { to: '/app/journal', icon: BookOpen, label: t('Journal', 'Log'), short: t('Journal', 'Log') },
    { to: '/app/physiologie', icon: Activity, label: t('Physiologie', 'Physiology'), short: 'Physio' },
    { to: '/app/outils', icon: Calculator, label: t('Outils', 'Tools'), short: t('Outils', 'Tools') },
    { to: '/app/profil', icon: User, label: t('Profil athlète', 'Athlete profile'), short: t('Profil', 'Profile') },
    { to: '/app/parametres', icon: Settings, label: t('Paramètres', 'Settings'), short: t('Réglages', 'Settings') },
  ];
  const mobileNav = nav.slice(0, 5);

  const onLogout = () =>
    logout.mutate(undefined, {
      onSettled: () => navigate('/connexion', { replace: true }),
    });

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive ? 'bg-lime/10 text-lime font-semibold' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-ink text-white">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-lime focus:px-4 focus:py-2 focus:text-black">
        {t('Aller au contenu', 'Skip to content')}
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-panel lg:flex print:hidden">
        <div className="flex h-16 items-center px-5">
          <Link to="/app" aria-label="ThusStride">
            <Logo size={28} />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label={t('Navigation de l\'espace', 'Space navigation')}>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
              <n.icon className="h-4 w-4" aria-hidden="true" />
              {n.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              <Shield className="h-4 w-4" aria-hidden="true" />
              {t('Administration', 'Administration')}
            </NavLink>
          )}
        </nav>
        <div className="border-t border-white/5 p-4">
          <div className="mb-3 min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-white/40">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/[0.04] hover:text-white cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> {t('Se déconnecter', 'Sign out')}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-white/5 bg-ink/85 px-4 backdrop-blur-lg sm:px-6 print:hidden">
          <Link to="/app" className="lg:hidden" aria-label="ThusStride">
            <Logo size={26} />
          </Link>
          <div className="hidden text-sm text-white/40 lg:block">
            {t('Bonjour', 'Hello')}, <span className="text-white">{user?.name?.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch className="hidden sm:inline-flex" />
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative rounded-lg border border-white/10 p-2 text-white/70 hover:text-white cursor-pointer"
                aria-label={t('Notifications', 'Notifications') + (notifications.length ? ` (${notifications.length})` : '')}
                aria-expanded={bellOpen}
                aria-haspopup="true"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[10px] font-bold text-black">
                    {notifications.length}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-panel-2 p-2 shadow-2xl animate-fade-in">
                  <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">{t('Notifications', 'Notifications')}</p>
                  {notifications.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-white/50">{t('Rien de nouveau.', 'Nothing new.')}</p>
                  ) : (
                    <ul>
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <Link to={n.href} className="block rounded-lg px-2 py-2.5 hover:bg-white/[0.04]">
                            <span
                              className={`text-xs font-semibold ${n.tone === 'warn' ? 'text-amber-300' : n.tone === 'success' ? 'text-lime' : 'text-sky-300'}`}
                            >
                              {n.title}
                            </span>
                            <span className="mt-0.5 block text-sm text-white/70">{n.body}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link to="/app/parametres" className="mt-1 block rounded-lg px-2 py-2 text-xs text-white/50 hover:text-white">
                    {t('Gérer les rappels', 'Manage reminders')} →
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/app/parametres"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-lime/15 text-sm font-bold text-lime lg:hidden"
              aria-label={t('Paramètres du compte', 'Account settings')}
            >
              {user?.name?.[0]?.toUpperCase()}
            </Link>
          </div>
        </header>

        <main id="contenu" className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden print:hidden"
        aria-label={t('Navigation mobile', 'Mobile navigation')}
      >
        {mobileNav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? 'text-lime' : 'text-white/50'}`}
          >
            <n.icon className="h-5 w-5" aria-hidden="true" />
            {n.short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
