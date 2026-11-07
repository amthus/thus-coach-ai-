/**
 * Deterministic, science-based training plan generator.
 *
 * Used when no AI provider is configured or when the AI output fails validation, so the
 * platform always delivers a usable, safe plan. Principles applied:
 * - ~80/20 intensity distribution (Seiler): most volume in zone 2.
 * - Progressive overload capped at ~10 %/week, with a deload on week 4.
 * - Intensity sessions limited by level; none for beginners in week 1.
 * - Injury history ⇒ intensity sessions replaced by easy running.
 */
import type { GeneratedPlan, ProfileInput } from '../../shared/schemas';
import type { SessionType, WorkoutSession } from '../../shared/types';

const DAY_LAYOUTS: Record<number, number[]> = {
  1: [5],
  2: [2, 6],
  3: [1, 3, 6],
  4: [1, 3, 5, 6],
  5: [0, 1, 3, 4, 6],
  6: [0, 1, 2, 3, 4, 6],
};
const DAYS = {
  fr: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

const OBJECTIVE_LABEL = {
  fr: { sante: 'Santé et remise en forme', '5k': 'Objectif 5 km', '10k': 'Objectif 10 km', semi: 'Objectif semi-marathon', marathon: 'Objectif marathon', vitesse: 'Développement de la VMA' },
  en: { sante: 'Health and fitness', '5k': '5K goal', '10k': '10K goal', semi: 'Half-marathon goal', marathon: 'Marathon goal', vitesse: 'VO2max development' },
} as const;
const LEVEL_LABEL = {
  fr: { debutant: 'Débutant – progression prudente', intermediaire: 'Intermédiaire – développement', avance: 'Confirmé – performance' },
  en: { debutant: 'Beginner – careful progression', intermediaire: 'Intermediate – development', avance: 'Advanced – performance' },
} as const;

// Typical easy pace (min/km) per level, used to translate time into distance.
const EASY_PACE = { debutant: 7.0, intermediaire: 6.0, avance: 5.2 } as const;
const WEEK_FACTORS = [1, 1.08, 1.16, 0.85]; // week 4 = deload

type Lang = 'fr' | 'en';

function txt(lang: Lang, fr: string, en: string) {
  return lang === 'fr' ? fr : en;
}

function buildSession(
  lang: Lang,
  type: SessionType,
  minutes: number,
  level: ProfileInput['level'],
  week: number,
  idx: number,
  day: string,
): WorkoutSession {
  const pace = EASY_PACE[level];
  const paceFor = (t: SessionType) => (t === 'fractionne' ? pace * 0.85 : t === 'seuil' ? pace * 0.88 : t === 'longue' ? pace * 1.03 : pace);
  const distanceKm = type === 'repos' ? 0 : Math.round((minutes / paceFor(type)) * 10) / 10;
  const reps = level === 'debutant' ? 6 : level === 'intermediaire' ? 8 : 10;
  const blocks = level === 'avance' ? 3 : 2;
  const base = {
    id: `w${week}-s${idx + 1}`,
    day,
    type,
    durationMinutes: minutes,
    distanceKm,
  };
  switch (type) {
    case 'fractionne':
      return {
        ...base,
        title: txt(lang, 'Fractionné court (VMA)', 'Short intervals (VO2max)'),
        description: txt(
          lang,
          `${reps} × 1 min rapide à allure 5 km / 1 min 30 de récupération en trottinant. Restez relâché, ne sprintez pas.`,
          `${reps} × 1 min fast at 5K pace / 1:30 easy jog recovery. Stay relaxed, do not sprint.`,
        ),
        intensityPercent: 88,
        warmup: txt(lang, '15 min de footing facile + 4 lignes droites', '15 min easy jog + 4 strides'),
        cooldown: txt(lang, '10 min de footing très lent + étirements légers', '10 min very easy jog + light stretching'),
      };
    case 'seuil':
      return {
        ...base,
        title: txt(lang, 'Tempo au seuil', 'Threshold tempo'),
        description: txt(
          lang,
          `${blocks} × 8 min à allure "confortablement difficile" (zone 4), 2 min de récupération. Respiration contrôlée.`,
          `${blocks} × 8 min "comfortably hard" (zone 4), 2 min recovery. Controlled breathing.`,
        ),
        intensityPercent: 82,
        warmup: txt(lang, '15 min de footing facile', '15 min easy jog'),
        cooldown: txt(lang, '10 min de footing facile', '10 min easy jog'),
      };
    case 'longue':
      return {
        ...base,
        title: txt(lang, 'Sortie longue', 'Long run'),
        description: txt(
          lang,
          'Course continue en endurance fondamentale (zone 2). Vous devez pouvoir parler. Hydratez-vous au-delà de 45 min.',
          'Continuous zone-2 running. You should be able to talk. Hydrate beyond 45 minutes.',
        ),
        intensityPercent: 68,
        warmup: txt(lang, '5 min de marche active', '5 min brisk walk'),
        cooldown: txt(lang, '5 min de marche + mobilité des hanches', '5 min walk + hip mobility'),
      };
    case 'repos':
      return {
        ...base,
        title: txt(lang, 'Récupération active', 'Active recovery'),
        description: txt(lang, 'Marche, mobilité ou renforcement léger (gainage, mollets).', 'Walking, mobility or light strength (core, calves).'),
        intensityPercent: 40,
      };
    default:
      return {
        ...base,
        title: txt(lang, 'Footing en endurance fondamentale', 'Easy aerobic run'),
        description: txt(
          lang,
          'Allure facile en zone 2 (60-70 % de la FC de réserve). Développe la base aérobie et la récupération.',
          'Easy zone-2 pace (60–70 % of heart-rate reserve). Builds aerobic base and recovery.',
        ),
        intensityPercent: 65,
        warmup: txt(lang, '5 min de marche ou trot très lent', '5 min walk or very slow jog'),
        cooldown: txt(lang, '5 min de marche', '5 min walk'),
      };
  }
}

export function generateRulesPlan(profile: ProfileInput, lang: Lang = 'fr'): GeneratedPlan {
  const freq = Math.min(Math.max(profile.frequency, 1), 6);
  const days = DAY_LAYOUTS[freq].map((d) => DAYS[lang][d]);
  const hasInjury = profile.injuryHistory.trim().length > 0;
  const pace = EASY_PACE[profile.level];
  const baseEasy = Math.max(20, Math.min(70, Math.round(profile.avgDistance * pace)));
  const longFactor = profile.objective === 'marathon' ? 1.8 : profile.objective === 'semi' ? 1.6 : 1.35;
  const maxQuality = hasInjury ? 0 : profile.level === 'debutant' ? 1 : 2;

  const weeks = WEEK_FACTORS.map((factor, w) => {
    const weekNumber = w + 1;
    const types: SessionType[] = days.map(() => 'endurance');
    // Long run on the last day of the week when frequency allows.
    if (freq >= 2) types[types.length - 1] = 'longue';
    // Quality sessions (not in week 1 for beginners, never with injury history).
    let quality = weekNumber === 1 && profile.level === 'debutant' ? 0 : maxQuality;
    if (weekNumber === 4) quality = Math.min(quality, 1);
    const preferIntervals = profile.objective === 'vitesse' || profile.objective === '5k';
    const order: SessionType[] = preferIntervals ? ['fractionne', 'seuil'] : ['seuil', 'fractionne'];
    let q = 0;
    for (let i = 1; i < types.length - 1 && q < quality; i += 2, q++) types[i] = order[q];
    if (freq >= 5) types[0] = 'repos';

    const sessions = types.map((type, i) => {
      const minutes =
        type === 'repos'
          ? 30
          : type === 'longue'
            ? Math.round(baseEasy * longFactor * factor)
            : type === 'endurance'
              ? Math.round(baseEasy * factor)
              : Math.round((baseEasy + 15) * Math.min(factor, 1.1));
      return buildSession(lang, type, Math.min(minutes, 180), profile.level, weekNumber, i, days[i]);
    });

    const focus =
      weekNumber === 4
        ? txt(lang, 'Semaine d\'assimilation : volume réduit de 15 %', 'Recovery week: volume reduced by 15 %')
        : weekNumber === 1
          ? txt(lang, 'Mise en place et base aérobie', 'Set-up and aerobic base')
          : txt(lang, `Progression contrôlée (+${Math.round((factor - 1) * 100)} % de volume)`, `Controlled progression (+${Math.round((factor - 1) * 100)} % volume)`);
    return { weekNumber, focus, sessions };
  });

  const tips = [
    txt(lang, "80 % de votre temps de course doit rester en endurance fondamentale : vous devez pouvoir tenir une conversation.", '80 % of your running time should stay easy: you should be able to hold a conversation.'),
    txt(lang, "N'augmentez pas votre volume de plus de 10 % par semaine.", 'Do not increase weekly volume by more than 10 %.'),
    hasInjury
      ? txt(lang, `Antécédents signalés (« ${profile.injuryHistory} ») : aucune séance intense n'est programmée. Arrêtez-vous en cas de douleur et consultez un professionnel de santé.`, `Reported history ("${profile.injuryHistory}"): no high-intensity sessions are scheduled. Stop if pain occurs and consult a health professional.`)
      : txt(lang, 'Une douleur qui persiste plus de 48 h impose du repos et un avis médical.', 'Pain lasting more than 48 h requires rest and medical advice.'),
    txt(lang, 'Hydratez-vous avant les sorties de plus de 45 min et dormez au moins 7 h.', 'Hydrate before runs longer than 45 min and sleep at least 7 hours.'),
  ];

  return {
    objectiveLabel: OBJECTIVE_LABEL[lang][profile.objective],
    levelLabel: LEVEL_LABEL[lang][profile.level],
    coachTips: tips.join(' '),
    weeks,
  };
}

/** Rule-based load adjustment advice from post-run fatigue (RPE 1–10). */
export function rulesFatigueAdvice(fatigue: number, sessionType: SessionType, lang: Lang = 'fr'): string {
  if (fatigue >= 9)
    return txt(lang, 'Fatigue très élevée : prenez 48 h de repos complet, puis remplacez la prochaine séance intense par un footing de 20 à 30 min. Si la fatigue persiste, réduisez le volume de la semaine de 20 %.', 'Very high fatigue: take 48 h of complete rest, then replace the next hard session with a 20–30 min easy run. If fatigue persists, cut weekly volume by 20 %.');
  if (fatigue >= 7)
    return txt(lang, 'Fatigue élevée : réduisez la charge de 15 à 20 % sur les prochains jours et transformez la prochaine séance de fractionné ou de seuil en endurance fondamentale.', 'High fatigue: reduce load by 15–20 % over the next days and turn the next interval or threshold session into an easy run.');
  if (fatigue >= 5)
    return txt(lang, `Fatigue modérée, normale après une séance de type ${sessionType}. Gardez le plan, soignez le sommeil et l'hydratation, et restez strictement en zone 2 lors du prochain footing.`, `Moderate fatigue, normal after a ${sessionType} session. Keep the plan, prioritise sleep and hydration, and stay strictly in zone 2 on your next easy run.`);
  return txt(lang, 'Très bonne assimilation. Poursuivez le plan tel quel ; la progression de la semaine suivante est adaptée.', 'Great adaptation. Continue the plan as is; next week\'s progression is appropriate.');
}
