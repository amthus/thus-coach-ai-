import { Link } from 'react-router';
import { Badge, Card } from './ui/primitives';
import { useI18n } from '../lib/i18n';
import { estimateVo2Max, karvonenZones, resolveHeartRates, vo2Category } from '../../shared/physiology';
import { getCoach } from '../../shared/coaches';
import type { UserProfile } from '../../shared/types';

/** Rule-based, transparent advice derived from the athlete profile (no AI, no simulation). */
function adviceFor(p: UserProfile, t: (fr: string, en: string) => string): string[] {
  const out: string[] = [];
  const injury = p.injuryHistory.toLowerCase();
  if (/genou|knee|rotule|patell/.test(injury)) {
    out.push(t('Genou : privilégiez une cadence élevée (170-180 pas/min) et des surfaces souples pour réduire la charge fémoro-patellaire.', 'Knee: favour a high cadence (170-180 steps/min) and soft surfaces to reduce patellofemoral load.'));
  } else if (/cheville|ankle|achille|tendon/.test(injury)) {
    out.push(t('Cheville / tendon : évitez les terrains instables et renforcez les mollets (montées sur pointes, 3 × 15).', 'Ankle / tendon: avoid uneven ground and strengthen calves (calf raises, 3 × 15).'));
  } else if (injury.trim()) {
    out.push(t('Antécédent signalé : restez sur surfaces régulières et stoppez en cas de douleur.', 'Reported history: stay on even surfaces and stop if pain occurs.'));
  }
  if (p.level === 'debutant') {
    out.push(t("Règle des 10 % : n'augmentez pas votre volume hebdomadaire de plus de 10 %.", 'The 10 % rule: do not increase weekly volume by more than 10 %.'));
  }
  if (p.level === 'avance') {
    out.push(t('Réservez les chaussures à plaque carbone aux séances de seuil, de VMA et aux compétitions.', 'Keep carbon-plated shoes for threshold, interval sessions and races.'));
  }
  if (p.objective === 'marathon' || p.objective === 'semi') {
    out.push(t("Testez votre stratégie d'hydratation et de ravitaillement lors des sorties longues.", 'Rehearse your hydration and fuelling strategy on long runs.'));
  }
  if (p.objective === 'vitesse' || p.objective === '5k') {
    out.push(t('Ajoutez 4 lignes droites de 80 m en accélération progressive après vos footings faciles.', 'Add 4 × 80 m progressive strides after easy runs.'));
  }
  if (p.avgDistance * 6 > 45) {
    out.push(t('Au-delà de 45 min, prévoyez environ 150 ml d’eau toutes les 20 minutes.', 'Beyond 45 min, plan about 150 ml of water every 20 minutes.'));
  }
  return out;
}

export function InsightsPanel({ profile }: { profile: UserProfile }) {
  const { t, lang } = useI18n();
  const hr = resolveHeartRates(profile.age, profile.restingHr, profile.maxHr);
  const zones = karvonenZones(hr.max, hr.rest);
  const vo2 = estimateVo2Max(hr.max, profile.restingHr);
  const coach = getCoach(profile.coachId);
  const tips = adviceFor(profile, t);
  const catLabel = {
    low: t('À développer', 'To develop'),
    fair: t('Correct', 'Fair'),
    good: t('Bon', 'Good'),
    excellent: t('Excellent', 'Excellent'),
    superior: t('Supérieur', 'Superior'),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <h2 className="font-display text-lg font-semibold">{t('Vos repères cardiaques', 'Your heart-rate markers')}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-white/50">{t('FC max', 'Max HR')}</dt>
            <dd>
              {hr.max} bpm {!hr.maxMeasured && <Badge>{t('estimée', 'estimated')}</Badge>}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/50">{t('FC de repos', 'Resting HR')}</dt>
            <dd>
              {hr.rest} bpm {!hr.restMeasured && <Badge>{t('par défaut', 'default')}</Badge>}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/50">{t('FC de réserve', 'HR reserve')}</dt>
            <dd>{hr.reserve} bpm</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/50">VO2max</dt>
            <dd>
              {vo2 ? (
                <>
                  {vo2} ml/kg/min <Badge tone="lime">{catLabel[vo2Category(vo2)]}</Badge>
                </>
              ) : (
                <Link to="/app/profil" className="text-lime underline">
                  {t('Renseignez votre FC de repos', 'Add your resting HR')}
                </Link>
              )}
            </dd>
          </div>
        </dl>
        {vo2 && <p className="mt-3 text-xs text-white/40">{t('Estimation Uth-Sørensen (15,3 × FCmax / FCrepos).', 'Uth-Sørensen estimate (15.3 × HRmax / HRrest).')}</p>}
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">{t('Zones Karvonen', 'Karvonen zones')}</h2>
        <ul className="mt-4 space-y-2">
          {zones.map((z) => (
            <li key={z.zone} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
              <span>
                <span className="font-semibold text-lime">Z{z.zone}</span>{' '}
                <span className="text-white/50">
                  {z.minPct}-{z.maxPct} %
                </span>
              </span>
              <span className="font-mono">
                {z.minBpm}-{z.maxBpm} bpm
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">{t('Conseils personnalisés', 'Personal tips')}</h2>
        <ul className="mt-4 space-y-3 text-sm text-white/70">
          {tips.length ? tips.map((tip) => <li key={tip} className="border-l-2 border-lime/60 pl-3">{tip}</li>) : <li>{t('Continuez ainsi : votre profil ne présente pas de point de vigilance.', 'Keep it up: your profile shows no specific concern.')}</li>}
        </ul>
        <p className="mt-4 text-xs text-white/40">
          {t('Votre coach :', 'Your coach:')} {coach.name} · {coach.style[lang]}
        </p>
      </Card>
    </div>
  );
}
