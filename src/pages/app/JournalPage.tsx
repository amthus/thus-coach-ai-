import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { BookOpen, Download, Pencil, Trash2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, Select, Skeleton } from '../../components/ui/primitives';
import { WorkoutFeedbackModal } from '../../components/WorkoutFeedbackModal';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { useDeleteWorkout, useWorkouts } from '../../lib/queries';
import { downloadFile, SESSION_TYPE_LABEL, sourceLabel } from '../../lib/training';
import type { SessionType, WorkoutLog } from '../../../shared/types';

function toCsv(rows: WorkoutLog[]) {
  const head = ['date', 'session', 'type', 'planned_min', 'actual_min', 'distance_km', 'avg_hr', 'fatigue', 'notes'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [
    head.join(','),
    ...rows.map((r) =>
      [r.completedAt, r.sessionTitle, r.sessionType, r.plannedDurationMinutes, r.actualDurationMinutes, r.actualDistanceKm, r.avgHr, r.fatigue, r.notes]
        .map(esc)
        .join(','),
    ),
  ].join('\n');
}

export default function JournalPage() {
  const { t, lang, locale } = useI18n();
  const { data: workouts, isLoading } = useWorkouts();
  const remove = useDeleteWorkout();
  const [editing, setEditing] = useState<WorkoutLog | null>(null);
  const [type, setType] = useState<'all' | SessionType>('all');

  const filtered = useMemo(() => (workouts ?? []).filter((w) => type === 'all' || w.sessionType === type), [workouts, type]);

  return (
    <div>
      <Seo title={t('Journal | ThusStride', 'Log | ThusStride')} noindex />
      <PageHeader
        title={t("Journal d'entraînement", 'Training log')}
        subtitle={t('Toutes vos séances validées, avec votre ressenti et les recommandations reçues.', 'All your logged sessions, with your feelings and the recommendations received.')}
        actions={
          workouts &&
          workouts.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={() => downloadFile(`thusstride-journal-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(workouts), 'text/csv;charset=utf-8')}
            >
              CSV
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !workouts?.length ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title={t('Aucune séance enregistrée', 'No sessions logged')}
          text={t('Validez une séance depuis votre plan pour commencer votre journal.', 'Log a session from your plan to start your journal.')}
          action={
            <Link to="/app/plan" className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-black">
              {t('Aller à mon plan', 'Go to my plan')}
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-4 max-w-xs">
            <Select label={t('Filtrer par type', 'Filter by type')} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="all">{t('Toutes les séances', 'All sessions')}</option>
              {(Object.keys(SESSION_TYPE_LABEL) as SessionType[]).map((k) => (
                <option key={k} value={k}>
                  {SESSION_TYPE_LABEL[k][lang]}
                </option>
              ))}
            </Select>
          </div>
          <ul className="space-y-3">
            {filtered.map((w) => (
              <li key={w.id}>
                <Card as="article" className="!p-4 sm:!p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <time dateTime={w.completedAt} className="text-xs text-white/40">
                          {new Date(w.completedAt).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </time>
                        <Badge tone="sky">{SESSION_TYPE_LABEL[w.sessionType][lang]}</Badge>
                        {w.fatigue != null ? (
                          <Badge tone={w.fatigue >= 7 ? 'rose' : w.fatigue >= 5 ? 'amber' : 'lime'}>
                            {t('Fatigue', 'Fatigue')} {w.fatigue}/10
                          </Badge>
                        ) : (
                          <Badge tone="amber">{t('Fatigue à renseigner', 'Fatigue to log')}</Badge>
                        )}
                      </div>
                      <h2 className="mt-2 font-semibold">{w.sessionTitle}</h2>
                      <p className="mt-1 text-sm text-white/60">
                        {w.actualDurationMinutes ?? w.plannedDurationMinutes} min
                        {w.actualDistanceKm != null && ` · ${w.actualDistanceKm} km`}
                        {w.avgHr != null && ` · ${w.avgHr} bpm`}
                      </p>
                      {w.notes && <p className="mt-2 text-sm italic text-white/50">« {w.notes} »</p>}
                      {w.advice && (
                        <div className="mt-3 rounded-lg border-l-2 border-lime bg-lime/5 px-3 py-2 text-sm text-white/80">
                          <p className="whitespace-pre-line">{w.advice}</p>
                          <p className="mt-1 text-[11px] text-white/40">{sourceLabel(w.adviceSource, lang)}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(w)}>
                        {w.fatigue == null ? t('Renseigner', 'Fill in') : t('Modifier', 'Edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t('Supprimer', 'Delete')}
                        onClick={() => window.confirm(t('Supprimer cette séance du journal ?', 'Delete this session from the log?')) && remove.mutate(w.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
      <WorkoutFeedbackModal workout={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
