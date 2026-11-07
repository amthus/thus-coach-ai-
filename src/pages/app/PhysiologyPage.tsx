import { lazy, Suspense, useMemo } from 'react';
import { InsightsPanel } from '../../components/InsightsPanel';
import { PageHeader, Skeleton } from '../../components/ui/primitives';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { useActivePlan, useProfile, useWorkouts } from '../../lib/queries';
import { completedMap } from '../../lib/training';

// Contains charts (recharts): split into its own chunk.
const PhysiologyDashboard = lazy(() => import('../../components/PhysiologyDashboard'));

export default function PhysiologyPage() {
  const { t, lang } = useI18n();
  const { data: profile, isLoading } = useProfile();
  const { data: plan } = useActivePlan();
  const { data: workouts } = useWorkouts();
  const completed = useMemo(
    () => Object.fromEntries([...completedMap(workouts, plan?.id).keys()].map((k) => [k, true])),
    [workouts, plan?.id],
  );

  return (
    <div className="space-y-6">
      <Seo title={t('Physiologie | ThusStride', 'Physiology | ThusStride')} noindex />
      <PageHeader
        title={t('Physiologie et nutrition', 'Physiology and nutrition')}
        subtitle={t(
          'Vos zones cardiaques, vos indicateurs et des repères nutritionnels calculés à partir de votre profil.',
          'Your heart-rate zones, markers and nutrition guidance computed from your profile.',
        )}
      />
      {isLoading || !profile ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <InsightsPanel profile={profile} />
          <Suspense fallback={<Skeleton className="h-96" />}>
            <PhysiologyDashboard
              language={lang}
              athleteAge={profile.age}
              plan={plan}
              completedSessions={completed}
              initialMaxHr={profile.maxHr}
              initialRestingHr={profile.restingHr}
              initialWeight={profile.weightKg}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
