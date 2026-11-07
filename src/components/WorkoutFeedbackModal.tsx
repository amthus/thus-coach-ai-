import { useEffect, useState } from 'react';
import { Button, Input, Modal, Textarea } from './ui/primitives';
import { useToast } from './ui/Toaster';
import { useI18n } from '../lib/i18n';
import { useUpdateWorkout, useWorkoutAdvice } from '../lib/queries';
import { ApiError } from '../lib/api';
import { sourceLabel } from '../lib/training';
import type { WorkoutLog } from '../../shared/types';

const FATIGUE_LABEL = (n: number, t: (fr: string, en: string) => string) =>
  n <= 2
    ? t('Très facile', 'Very easy')
    : n <= 4
      ? t('Modérée – bonne assimilation', 'Moderate – well absorbed')
      : n <= 6
        ? t('Sensible – adaptation correcte', 'Noticeable – normal adaptation')
        : n <= 8
          ? t('Élevée – charge importante', 'High – heavy load')
          : t('Extrême – risque de surentraînement', 'Extreme – overtraining risk');

/** Post-run feedback: actual metrics + perceived fatigue, then load-adjustment advice. */
export function WorkoutFeedbackModal({ workout, onClose }: { workout: WorkoutLog | null; onClose: () => void }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const update = useUpdateWorkout();
  const advice = useWorkoutAdvice();
  const [fatigue, setFatigue] = useState(5);
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [hr, setHr] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<WorkoutLog | null>(null);

  useEffect(() => {
    if (!workout) return;
    setFatigue(workout.fatigue ?? 5);
    setDuration(workout.actualDurationMinutes?.toString() ?? '');
    setDistance(workout.actualDistanceKm?.toString() ?? '');
    setHr(workout.avgHr?.toString() ?? '');
    setNotes(workout.notes ?? '');
    setResult(null);
  }, [workout]);

  const busy = update.isPending || advice.isPending;

  const submit = async () => {
    if (!workout) return;
    const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));
    try {
      await update.mutateAsync({
        id: workout.id,
        fatigue,
        actualDurationMinutes: num(duration),
        actualDistanceKm: num(distance),
        avgHr: num(hr),
        notes,
      });
      const w = await advice.mutateAsync(workout.id);
      setResult(w);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("Impossible d'enregistrer le retour.", 'Could not save feedback.'));
    }
  };

  return (
    <Modal
      open={Boolean(workout)}
      onClose={onClose}
      title={result ? t('Recommandation du coach', 'Coach recommendation') : t('Comment s’est passée la séance ?', 'How did the session go?')}
      footer={
        result ? (
          <Button onClick={onClose}>{t('Compris', 'Got it')}</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              {t('Plus tard', 'Later')}
            </Button>
            <Button onClick={submit} loading={busy}>
              {advice.isPending ? t('Analyse…', 'Analysing…') : t('Enregistrer et analyser', 'Save and analyse')}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">{result.advice}</p>
          <p className="text-xs text-white/40">
            {t('Source :', 'Source:')} {sourceLabel(result.adviceSource, lang)}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-white/60">{workout?.sessionTitle}</p>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-white/80">{t('Fatigue ressentie (1 à 10)', 'Perceived fatigue (1 to 10)')}</legend>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10" role="radiogroup">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={fatigue === n}
                  onClick={() => setFatigue(n)}
                  className={`h-10 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                    fatigue === n ? 'border-lime bg-lime text-black' : 'border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className={`mt-2 text-xs ${fatigue >= 7 ? 'text-rose-300' : fatigue >= 5 ? 'text-amber-300' : 'text-lime'}`}>{FATIGUE_LABEL(fatigue, t)}</p>
          </fieldset>
          <div className="grid grid-cols-3 gap-3">
            <Input label={t('Durée (min)', 'Time (min)')} type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
            <Input label={t('Distance (km)', 'Distance (km)')} type="number" inputMode="decimal" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} />
            <Input label={t('FC moy.', 'Avg HR')} type="number" inputMode="numeric" value={hr} onChange={(e) => setHr(e.target.value)} />
          </div>
          <Textarea label={t('Notes (facultatif)', 'Notes (optional)')} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-16" />
        </>
      )}
    </Modal>
  );
}
