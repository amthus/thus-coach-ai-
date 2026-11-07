import { useState, type FormEvent } from 'react';
import { Alert, Button, Input, Select, Textarea } from './ui/primitives';
import { useI18n } from '../lib/i18n';
import { useMeta } from '../lib/queries';
import { ProfileSchema, type ProfileInput } from '../../shared/schemas';
import { COACHES } from '../../shared/coaches';
import { estimateMaxHr } from '../../shared/physiology';
import type { UserProfile } from '../../shared/types';

export const DEFAULT_PROFILE: ProfileInput = {
  age: 30,
  level: 'debutant',
  frequency: 3,
  avgDistance: 5,
  objective: '10k',
  customObjective: '',
  injuryHistory: '',
  restingHr: null,
  maxHr: null,
  weightKg: null,
  coachId: 'michel',
  aiProvider: 'gemini',
};

type FormState = Omit<ProfileInput, 'restingHr' | 'maxHr' | 'weightKg' | 'age' | 'frequency' | 'avgDistance'> & {
  age: string;
  frequency: string;
  avgDistance: string;
  restingHr: string;
  maxHr: string;
  weightKg: string;
};

const toForm = (p: ProfileInput | UserProfile): FormState => ({
  ...p,
  age: String(p.age),
  frequency: String(p.frequency),
  avgDistance: String(p.avgDistance),
  restingHr: p.restingHr ? String(p.restingHr) : '',
  maxHr: p.maxHr ? String(p.maxHr) : '',
  weightKg: p.weightKg ? String(p.weightKg) : '',
});

export function ProfileForm({
  initial,
  submitLabel,
  loading,
  error,
  onSubmit,
}: {
  initial?: UserProfile | null;
  submitLabel: string;
  loading: boolean;
  error?: string | null;
  onSubmit: (p: ProfileInput) => void;
}) {
  const { t, lang } = useI18n();
  const { data: meta } = useMeta();
  const [form, setForm] = useState<FormState>(() => toForm(initial ?? DEFAULT_PROFILE));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = ProfileSchema.safeParse({
      ...form,
      restingHr: form.restingHr === '' ? null : form.restingHr,
      maxHr: form.maxHr === '' ? null : form.maxHr,
      weightKg: form.weightKg === '' ? null : form.weightKg,
    });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      const msg: Record<string, string> = {};
      if (f.age) msg.age = t('Entre 15 et 90 ans.', 'Between 15 and 90.');
      if (f.frequency) msg.frequency = t('Entre 1 et 6 séances.', 'Between 1 and 6 sessions.');
      if (f.avgDistance) msg.avgDistance = t('Entre 1 et 50 km.', 'Between 1 and 50 km.');
      if (f.restingHr) msg.restingHr = t('Entre 30 et 120 bpm.', 'Between 30 and 120 bpm.');
      if (f.maxHr) msg.maxHr = t('Entre 120 et 230 bpm.', 'Between 120 and 230 bpm.');
      if (f.weightKg) msg.weightKg = t('Entre 30 et 250 kg.', 'Between 30 and 250 kg.');
      if (f.injuryHistory || f.customObjective) msg.injuryHistory = t('Texte trop long.', 'Text too long.');
      setErrors(msg);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  };

  const ageNum = Number(form.age) || 30;

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      {error && <Alert tone="error">{error}</Alert>}

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-lg font-semibold">{t('Votre pratique', 'Your running')}</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label={t('Âge', 'Age')} type="number" inputMode="numeric" min={15} max={90} required value={form.age} onChange={(e) => set('age', e.target.value)} error={errors.age} />
          <Input label={t('Séances par semaine', 'Sessions per week')} type="number" inputMode="numeric" min={1} max={6} required value={form.frequency} onChange={(e) => set('frequency', e.target.value)} error={errors.frequency} />
          <Input label={t('Distance habituelle (km)', 'Usual distance (km)')} type="number" inputMode="decimal" step="0.5" min={1} max={50} required value={form.avgDistance} onChange={(e) => set('avgDistance', e.target.value)} error={errors.avgDistance} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={t('Niveau', 'Level')} value={form.level} onChange={(e) => set('level', e.target.value)}>
            <option value="debutant">{t('Débutant – moins de 6 mois', 'Beginner – under 6 months')}</option>
            <option value="intermediaire">{t('Intermédiaire – course régulière', 'Intermediate – regular running')}</option>
            <option value="avance">{t('Confirmé – entraînement structuré', 'Advanced – structured training')}</option>
          </Select>
          <Select label={t('Objectif principal', 'Main goal')} value={form.objective} onChange={(e) => set('objective', e.target.value)}>
            <option value="sante">{t('Santé et remise en forme', 'Health and fitness')}</option>
            <option value="5k">{t('Courir 5 km', 'Run 5K')}</option>
            <option value="10k">{t('Réussir un 10 km', 'Complete a 10K')}</option>
            <option value="semi">{t('Semi-marathon (21,1 km)', 'Half marathon (21.1 km)')}</option>
            <option value="marathon">{t('Marathon (42,2 km)', 'Marathon (42.2 km)')}</option>
            <option value="vitesse">{t('Vitesse et VMA', 'Speed and VO2max')}</option>
          </Select>
        </div>
        <Input
          label={t('Précisions sur votre objectif', 'Goal details')}
          placeholder={t('Ex. : moins de 50 min au 10 km le 15 mars', 'E.g. sub-50 min 10K on March 15')}
          maxLength={200}
          value={form.customObjective}
          onChange={(e) => set('customObjective', e.target.value)}
        />
        <Textarea
          label={t('Douleurs ou antécédents de blessures', 'Pain or injury history')}
          placeholder={t('Ex. : tendinite d’Achille l’an dernier, genou sensible en descente', 'E.g. Achilles tendinitis last year, knee sensitive downhill')}
          hint={t('En cas de douleur signalée, aucune séance intense ne sera programmée.', 'If pain is reported, no hard sessions will be scheduled.')}
          maxLength={300}
          value={form.injuryHistory}
          onChange={(e) => set('injuryHistory', e.target.value)}
          error={errors.injuryHistory}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 font-display text-lg font-semibold">{t('Physiologie (facultatif)', 'Physiology (optional)')}</legend>
        <p className="text-sm text-white/50">
          {t(
            'Mesurez votre FC de repos le matin au réveil, allongé. Sans ces valeurs, ThusStride utilise des estimations.',
            'Measure your resting HR in the morning, lying down. Without these values, ThusStride uses estimates.',
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label={t('FC de repos (bpm)', 'Resting HR (bpm)')} type="number" inputMode="numeric" placeholder="60" value={form.restingHr} onChange={(e) => set('restingHr', e.target.value)} error={errors.restingHr} />
          <Input
            label={t('FC max (bpm)', 'Max HR (bpm)')}
            type="number"
            inputMode="numeric"
            placeholder={String(estimateMaxHr(ageNum))}
            hint={t(`Estimée : ${estimateMaxHr(ageNum)} bpm`, `Estimated: ${estimateMaxHr(ageNum)} bpm`)}
            value={form.maxHr}
            onChange={(e) => set('maxHr', e.target.value)}
            error={errors.maxHr}
          />
          <Input label={t('Poids (kg)', 'Weight (kg)')} type="number" inputMode="decimal" placeholder="70" value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} error={errors.weightKg} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-display text-lg font-semibold">{t('Votre coach', 'Your coach')}</legend>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
          {COACHES.map((c) => (
            <label
              key={c.id}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                form.coachId === c.id ? 'border-lime bg-lime/5' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <input type="radio" name="coach" value={c.id} checked={form.coachId === c.id} onChange={() => set('coachId', c.id)} className="sr-only" />
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime/15 font-display font-bold text-lime">{c.avatar}</span>
              <span>
                <span className="block text-sm font-semibold">{c.name}</span>
                <span className="mt-0.5 block text-xs text-white/50">{c.description[lang]}</span>
              </span>
            </label>
          ))}
        </div>
        <Select
          label={t("Moteur d'IA préféré", 'Preferred AI engine')}
          value={form.aiProvider}
          onChange={(e) => set('aiProvider', e.target.value)}
          hint={
            meta && !meta.ai.gemini && !meta.ai.granite
              ? t("Aucun moteur d'IA n'est configuré sur ce serveur : le moteur de règles ThusStride sera utilisé.", 'No AI engine is configured on this server: the ThusStride rules engine will be used.')
              : t("Si le moteur choisi est indisponible, l'autre est utilisé, puis le moteur de règles.", 'If the chosen engine is unavailable, the other one is used, then the rules engine.')
          }
        >
          <option value="gemini">Google Gemini{meta && !meta.ai.gemini ? t(' (non configuré)', ' (not configured)') : ''}</option>
          <option value="granite">IBM Granite (watsonx){meta && !meta.ai.granite ? t(' (non configuré)', ' (not configured)') : ''}</option>
        </Select>
      </fieldset>

      <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
