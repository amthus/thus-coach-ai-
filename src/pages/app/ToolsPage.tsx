import { useMemo, useState } from 'react';
import RunningPaceCalc from '../../components/RunningPaceCalc';
import { StopwatchTimer } from '../../components/TrainingPlanDisplay';
import { Card, Input, PageHeader, Select } from '../../components/ui/primitives';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { formatDuration, formatPace, riegelPredict } from '../../../shared/physiology';

const DISTANCES = [
  { km: 5, fr: '5 km', en: '5K' },
  { km: 10, fr: '10 km', en: '10K' },
  { km: 21.0975, fr: 'Semi-marathon', en: 'Half marathon' },
  { km: 42.195, fr: 'Marathon', en: 'Marathon' },
];

function RacePredictor() {
  const { t, lang } = useI18n();
  const [km, setKm] = useState('10');
  const [h, setH] = useState('0');
  const [m, setM] = useState('55');
  const [s, setS] = useState('0');

  const known = (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
  const knownKm = Number(km);
  const rows = useMemo(
    () =>
      known > 0 && knownKm > 0
        ? DISTANCES.map((d) => {
            const sec = riegelPredict(known, knownKm, d.km);
            return { ...d, time: formatDuration(sec), pace: formatPace(sec / d.km) };
          })
        : [],
    [known, knownKm],
  );

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold">{t('Prédiction de temps de course', 'Race time predictor')}</h2>
      <p className="mt-1 text-sm text-white/50">
        {t('Formule de Riegel à partir d’une course récente réalisée à fond.', 'Riegel formula from a recent all-out race.')}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select label={t('Distance courue', 'Distance run')} value={km} onChange={(e) => setKm(e.target.value)}>
          {DISTANCES.map((d) => (
            <option key={d.km} value={d.km}>
              {d[lang]}
            </option>
          ))}
        </Select>
        <Input label={t('Heures', 'Hours')} type="number" min={0} max={9} inputMode="numeric" value={h} onChange={(e) => setH(e.target.value)} />
        <Input label="Minutes" type="number" min={0} max={59} inputMode="numeric" value={m} onChange={(e) => setM(e.target.value)} />
        <Input label={t('Secondes', 'Seconds')} type="number" min={0} max={59} inputMode="numeric" value={s} onChange={(e) => setS(e.target.value)} />
      </div>
      {rows.length > 0 && (
        <table className="mt-5 w-full text-sm">
          <caption className="sr-only">{t('Temps prédits', 'Predicted times')}</caption>
          <thead>
            <tr className="text-left text-xs text-white/40">
              <th className="pb-2 font-medium">{t('Distance', 'Distance')}</th>
              <th className="pb-2 font-medium">{t('Temps', 'Time')}</th>
              <th className="pb-2 font-medium">{t('Allure', 'Pace')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.km} className="border-t border-white/5">
                <td className="py-2">{r[lang]}</td>
                <td className="py-2 font-mono text-lime">{r.time}</td>
                <td className="py-2 font-mono">{r.pace} /km</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-xs text-white/40">
        {t('Estimation indicative : suppose un entraînement adapté à la distance visée.', 'Indicative estimate: assumes training suited to the target distance.')}
      </p>
    </Card>
  );
}

export default function ToolsPage() {
  const { t, lang } = useI18n();
  return (
    <div className="space-y-6">
      <Seo title={t('Outils | ThusStride', 'Tools | ThusStride')} noindex />
      <PageHeader title={t('Outils du coureur', 'Runner tools')} subtitle={t('Allures, prédictions et chronomètre.', 'Paces, predictions and stopwatch.')} />
      <RunningPaceCalc language={lang} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RacePredictor />
        <Card>
          <h2 className="mb-4 font-display text-lg font-semibold">{t('Chronomètre', 'Stopwatch')}</h2>
          <StopwatchTimer sessionId="tools" durationMinutes={30} language={lang} />
        </Card>
      </div>
    </div>
  );
}
