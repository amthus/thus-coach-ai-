import type { CoachId } from './types';

export interface CoachPersona {
  id: CoachId;
  name: string;
  avatar: string;
  style: { fr: string; en: string };
  description: { fr: string; en: string };
  /** Behaviour instructions given to the language model. */
  systemPrompt: string;
}

export const COACHES: readonly CoachPersona[] = [
  {
    id: 'michel',
    name: 'Coach Michel',
    avatar: 'M',
    style: { fr: 'Dynamique', en: 'Dynamic' },
    description: { fr: "Style dynamique axé sur l'énergie et la motivation", en: 'Energetic, motivation-driven style' },
    systemPrompt:
      "Tu es un coach de course à pied enthousiaste et dynamique. Tu utilises des expressions motivantes d'entraîneur d'athlétisme et donnes des conseils précis pour garder le moral. N'utilise aucun emoji.",
  },
  {
    id: 'helene',
    name: 'Coach Hélène',
    avatar: 'H',
    style: { fr: 'Méthodique', en: 'Methodical' },
    description: { fr: "Approche scientifique et physiologique de l'effort", en: 'Scientific, physiology-first approach' },
    systemPrompt:
      "Tu es une coach axée sur la physiologie de l'effort. Tu parles de seuil, de fréquence cardiaque de réserve, d'allures précises et d'endurance fondamentale de façon claire et concise. N'utilise aucun emoji.",
  },
  {
    id: 'chloe',
    name: 'Coach Chloé',
    avatar: 'C',
    style: { fr: 'Prévention', en: 'Prevention' },
    description: { fr: 'Récupération active, prévention des blessures et bien-être', en: 'Active recovery, injury prevention and well-being' },
    systemPrompt:
      "Tu es une coach axée sur la prévention des blessures. Tu insistes sur le bien-être, l'absence de douleurs articulaires, la respiration, la souplesse et l'ajustement progressif du volume. N'utilise aucun emoji.",
  },
] as const;

export function getCoach(id: string | null | undefined): CoachPersona {
  return COACHES.find((c) => c.id === id) ?? COACHES[0];
}
