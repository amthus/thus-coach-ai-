import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { ArrowRight, BookOpen, Calculator, CalendarDays, Flame, MessageSquare, Timer, TrendingUp } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader, Skeleton } from '../../components/ui/primitives';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { useActivePlan, useMe, useProfile, useStats, useWorkouts } from '../../lib/queries';
import { completedMap, nextSession, planProgress, SESSION_TYPE_LABEL, sourceLabel } from '../../lib/training';
import { getCoach } from '../../../shared/coaches';

// Recharts is heavy: load it only when the chart is rendered.
const WeeklyChart = lazy(() => import('../../components/WeeklyChart'));

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { data: user } = useMe();
  const { data: profile } = useProfile();
  const { data: plan, isLoading: planLoading } = useActivePlan();
  const { data: workouts } = useWorkouts();
  const { data: stats, isLoading: statsLoading } = useStats();

  const done = completedMap(workouts, plan?.id);
  const next = nextSession(plan, done);
  const progress = planProgress(plan, done);
  const coach = getCoach(profile?.coachId);

  const kpis = [
    { icon: TrendingUp, label: t('Séances réalisées', 'Sessions done'), value: stats?.totalWorkouts ?? 0 },
    { icon: Timer, label: t('Temps total', 'Total time'), value: stats ? `${Math.floor(stats.totalMinutes / 60)} h ${String(stats.totalMinutes % 60).padStart(2, '0')}` : '—' },
    { icon: CalendarDays, label: t('Distance totale', 'Total distance'), value: stats ? `${stats.totalDistanceKm} km` : '—' },
    { icon: Flame, label: t('Série en cours', 'Current streak'), value: stats ? `${stats.currentStreakDays} ${t('j', 'd')}` : '—' },
  ];

  return (
    <div className="space-y-6">
      <Seo title={t('Tableau de bord | ThusStride', 'Dashboard | ThusStride')} noindex />
      <PageHeader
        title={t(`Bonjour ${user?.name ?? ''}`, `Hello ${user?.name ?? ''}`)}
        subtitle={t('Voici où en est votre entraînement.', 'Here is where your training stands.')}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} as="div" className="!p-4">
            <k.icon className="h-4 w-4 text-lime" aria-hidden="true" />
            <p className="mt-3 text-xs text-white/50">{k.label}</p>
            {statsLoading ? <Skeleton className="mt-1 h-7 w-16" /> : <p className="mt-1 font-display text-2xl font-bold">{k.value}</p>}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">{t('Prochaine séance', 'Next session')}</h2>
            {plan && <Badge tone="lime">{progress.percent} %</Badge>}
          </div>
          {planLoading ? (
            <Skeleton className="mt-4 h-28" />
          ) : !plan ? (
            <div className="mt-4">
              <EmptyState
                icon={<CalendarDays className="h-8 w-8" />}
                title={t('Aucun plan actif', 'No active plan')}
                text={t('Générez votre plan de 4 semaines personnalisé.', 'Generate your personalised 4-week plan.')}
                action={
                  <Link to="/app/plan" className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-black">
                    {t('Générer mon plan', 'Generate my plan')}
                  </Link>
                }
              />
            </div>
          ) : next ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                <Badge>{t('Semaine', 'Week')} {next.week}</Badge>
                <Badge tone="sky">{SESSION_TYPE_LABEL[next.session.type][lang]}</Badge>
                <span>{next.session.day}</span>
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold">{next.session.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-white/60">{next.session.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/70">
                <span>⏱ {next.session.durationMinutes} min</span>
                {next.session.distanceKm ? <span>≈ {next.session.distanceKm} km</span> : null}
                <span>{next.session.intensityPercent} % {t('FC de réserve', 'HR reserve')}</span>
              </div>
              <Link to="/app/plan" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-lime hover:underline">
                {t('Voir mon plan et valider la séance', 'Open my plan and log the session')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/60">
              {t('Plan terminé, bravo ! Générez un nouveau cycle depuis la page Plan.', 'Plan completed, well done! Generate a new cycle from the Plan page.')}
            </p>
          )}
          {plan && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-white/50">
                <span>{plan.objectiveLabel}</span>
                <span>
                  {progress.completed}/{progress.total}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-lime transition-all" style={{ width: `${progress.percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/40">
                {t('Source :', 'Source:')} {sourceLabel(plan.source, lang)}
              </p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold">{t('Accès rapide', 'Quick access')}</h2>
          <ul className="mt-4 space-y-2">
            {[
              { to: '/app/coach', icon: MessageSquare, label: t(`Parler à ${coach.name}`, `Talk to ${coach.name}`) },
              { to: '/app/journal', icon: BookOpen, label: t('Mon journal', 'My log') },
              { to: '/app/outils', icon: Calculator, label: t("Calculateur d'allure", 'Pace calculator') },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-3 text-sm hover:border-lime/40 hover:bg-white/[0.02]">
                  <l.icon className="h-4 w-4 text-lime" aria-hidden="true" />
                  <span className="flex-1">{l.label}</span>
                  <ArrowRight className="h-4 w-4 text-white/30" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {stats?.avgFatigue != null && (
            <div className="mt-5 rounded-lg bg-white/[0.03] p-3 text-sm">
              <span className="text-white/50">{t('Fatigue moyenne', 'Average fatigue')} : </span>
              <span className={stats.avgFatigue >= 7 ? 'text-rose-300' : stats.avgFatigue >= 5 ? 'text-amber-300' : 'text-lime'}>{stats.avgFatigue}/10</span>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">{t('Volume des 8 dernières semaines', 'Last 8 weeks volume')}</h2>
        <div className="mt-4 h-64">
          {statsLoading || !stats ? (
            <Skeleton className="h-full" />
          ) : stats.totalWorkouts === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-white/40">
              {t('Validez votre première séance pour voir votre progression.', 'Log your first session to see your progress.')}
            </p>
          ) : (
            <Suspense fallback={<Skeleton className="h-full" />}>
              <WeeklyChart data={stats.weekly} />
            </Suspense>
          )}
        </div>
      </Card>
    </div>
  );
}
