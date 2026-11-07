import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, Download, History, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { Alert, Badge, Button, Card, EmptyState, Modal, PageHeader, Skeleton } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toaster';
import { WorkoutFeedbackModal } from '../../components/WorkoutFeedbackModal';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import {
  useActivatePlan,
  useActivePlan,
  useDeletePlan,
  useDeleteWorkout,
  useGeneratePlan,
  useLogWorkout,
  useMe,
  usePlans,
  useProfile,
  useWorkouts,
} from '../../lib/queries';
import { ApiError } from '../../lib/api';
import { completedMap, downloadFile, planToMarkdown, sourceLabel } from '../../lib/training';
import { resolveHeartRates } from '../../../shared/physiology';
import type { WorkoutLog } from '../../../shared/types';

const TrainingPlanDisplay = lazy(() => import('../../components/TrainingPlanDisplay'));

export default function PlanPage() {
  const { t, lang, locale } = useI18n();
  const toast = useToast();
  const { data: user } = useMe();
  const { data: profile } = useProfile();
  const { data: plan, isLoading } = useActivePlan();
  const { data: workouts } = useWorkouts();
  const { data: plans } = usePlans();
  const generate = useGeneratePlan();
  const activate = useActivatePlan();
  const deletePlan = useDeletePlan();
  const logWorkout = useLogWorkout();
  const deleteWorkout = useDeleteWorkout();

  const [confirmRegen, setConfirmRegen] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<WorkoutLog | null>(null);
  const [undoFor, setUndoFor] = useState<WorkoutLog | null>(null);

  const done = useMemo(() => completedMap(workouts, plan?.id), [workouts, plan?.id]);
  const completedSessions = useMemo(() => Object.fromEntries([...done.keys()].map((k) => [k, true])), [done]);
  const sessionFatigue = useMemo(
    () => Object.fromEntries([...done].filter(([, w]) => w.fatigue != null).map(([k, w]) => [k, w.fatigue as number])),
    [done],
  );
  const recommendations = useMemo(
    () => Object.fromEntries([...done].filter(([, w]) => w.advice).map(([k, w]) => [k, w.advice as string])),
    [done],
  );
  const hr = profile ? resolveHeartRates(profile.age, profile.restingHr, profile.maxHr) : null;

  const runGenerate = () =>
    generate.mutate(undefined, {
      onSuccess: (p) => {
        setConfirmRegen(false);
        toast.success(
          t(`Nouveau plan généré (${sourceLabel(p.source, 'fr')}).`, `New plan generated (${sourceLabel(p.source, 'en')}).`),
        );
      },
      onError: (e) => toast.error(e instanceof ApiError ? e.message : t('Échec de la génération.', 'Generation failed.')),
    });

  const onToggle = (sessionId: string) => {
    if (!plan || logWorkout.isPending) return;
    const existing = done.get(sessionId);
    if (existing) {
      setUndoFor(existing);
      return;
    }
    logWorkout.mutate(
      { planId: plan.id, sessionId },
      {
        onSuccess: (w) => {
          toast.success(t('Séance validée !', 'Session logged!'));
          setFeedbackFor(w);
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : t('Échec de l’enregistrement.', 'Could not save.')),
      },
    );
  };

  return (
    <div className="space-y-6">
      <Seo title={t('Mon plan | ThusStride', 'My plan | ThusStride')} noindex />
      <PageHeader
        title={t("Mon plan d'entraînement", 'My training plan')}
        subtitle={
          plan
            ? t(
                `Généré le ${new Date(plan.createdAt).toLocaleDateString(locale)} · Source : ${sourceLabel(plan.source, 'fr')}`,
                `Generated on ${new Date(plan.createdAt).toLocaleDateString(locale)} · Source: ${sourceLabel(plan.source, 'en')}`,
              )
            : undefined
        }
        actions={
          plan && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                onClick={() => downloadFile(`thusstride-plan-${plan.createdAt.slice(0, 10)}.md`, planToMarkdown(plan, user?.name ?? '', lang), 'text/markdown')}
              >
                {t('Exporter', 'Export')}
              </Button>
              <Button size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => setConfirmRegen(true)}>
                {t('Nouveau plan', 'New plan')}
              </Button>
            </>
          )
        }
      />

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : !plan ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title={t('Pas encore de plan actif', 'No active plan yet')}
          text={t(
            'Votre plan de 4 semaines est construit à partir de votre profil athlète. La génération prend quelques secondes.',
            'Your 4-week plan is built from your athlete profile. Generation takes a few seconds.',
          )}
          action={
            <div className="flex flex-col items-center gap-3">
              <Button size="lg" icon={<Sparkles className="h-4 w-4" />} loading={generate.isPending} onClick={runGenerate}>
                {generate.isPending ? t('Génération en cours…', 'Generating…') : t('Générer mon plan', 'Generate my plan')}
              </Button>
              <Link to="/app/profil" className="text-sm text-white/50 hover:text-white">
                {t('Vérifier mon profil', 'Review my profile')}
              </Link>
            </div>
          }
        />
      ) : (
        <>
          {generate.isPending && <Alert tone="info">{t('Génération du nouveau plan…', 'Generating the new plan…')}</Alert>}
          <Suspense fallback={<Skeleton className="h-96" />}>
            <TrainingPlanDisplay
              plan={plan}
              completedSessions={completedSessions}
              onToggleSession={onToggle}
              language={lang}
              sessionFatigue={sessionFatigue}
              fatigueRecommendations={recommendations}
              athleteName={user?.name ?? ''}
              maxHr={hr?.max}
              restingHr={hr?.rest}
            />
          </Suspense>
        </>
      )}

      {plans && plans.length > 1 && (
        <Card>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <History className="h-5 w-5 text-lime" /> {t('Historique des plans', 'Plan history')}
          </h2>
          <ul className="mt-4 divide-y divide-white/5">
            {plans.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {p.objectiveLabel} {p.isActive && <Badge tone="lime">{t('Actif', 'Active')}</Badge>}
                  </p>
                  <p className="text-xs text-white/40">
                    {new Date(p.createdAt).toLocaleDateString(locale)} · {p.completedSessions}/{p.totalSessions} {t('séances', 'sessions')} · {sourceLabel(p.source, lang)}
                  </p>
                </div>
                {!p.isActive && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" loading={activate.isPending && activate.variables === p.id} onClick={() => activate.mutate(p.id)}>
                      {t('Réactiver', 'Reactivate')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t('Supprimer ce plan', 'Delete this plan')}
                      loading={deletePlan.isPending && deletePlan.variables === p.id}
                      onClick={() => {
                        if (window.confirm(t('Supprimer ce plan et ses séances enregistrées ?', 'Delete this plan and its logged sessions?'))) deletePlan.mutate(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={confirmRegen}
        onClose={() => setConfirmRegen(false)}
        title={t('Générer un nouveau plan ?', 'Generate a new plan?')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmRegen(false)} disabled={generate.isPending}>
              {t('Annuler', 'Cancel')}
            </Button>
            <Button loading={generate.isPending} onClick={runGenerate}>
              {t('Générer', 'Generate')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-white/70">
          {t(
            'Un nouveau cycle de 4 semaines sera créé à partir de votre profil actuel. Le plan en cours reste disponible dans l’historique avec ses séances enregistrées.',
            'A new 4-week cycle will be created from your current profile. The current plan stays in your history with its logged sessions.',
          )}
        </p>
      </Modal>

      <Modal
        open={Boolean(undoFor)}
        onClose={() => setUndoFor(null)}
        title={t('Annuler la validation ?', 'Undo this session?')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setUndoFor(null)}>
              {t('Non', 'No')}
            </Button>
            <Button
              variant="danger"
              loading={deleteWorkout.isPending}
              onClick={() =>
                undoFor &&
                deleteWorkout.mutate(undoFor.id, {
                  onSuccess: () => {
                    setUndoFor(null);
                    toast.info(t('Séance remise à faire.', 'Session marked as to do.'));
                  },
                })
              }
            >
              {t('Oui, annuler', 'Yes, undo')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-white/70">
          {t('Les données saisies (fatigue, notes, recommandation) pour cette séance seront supprimées.', 'Data entered for this session (fatigue, notes, recommendation) will be deleted.')}
        </p>
      </Modal>

      <WorkoutFeedbackModal workout={feedbackFor} onClose={() => setFeedbackFor(null)} />
    </div>
  );
}
