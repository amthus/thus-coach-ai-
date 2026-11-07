import type { SessionType, TrainingPlan, WorkoutLog, WorkoutSession } from '../../shared/types';

export function completedMap(workouts: WorkoutLog[] | undefined, planId: string | undefined): Map<string, WorkoutLog> {
  const map = new Map<string, WorkoutLog>();
  if (!workouts || !planId) return map;
  for (const w of workouts) if (w.planId === planId) map.set(w.sessionId, w);
  return map;
}

export function nextSession(plan: TrainingPlan | null | undefined, done: Map<string, WorkoutLog>) {
  if (!plan) return null;
  for (const week of plan.weeks) {
    for (const s of week.sessions) if (!done.has(s.id)) return { session: s, week: week.weekNumber };
  }
  return null;
}

export function planProgress(plan: TrainingPlan | null | undefined, done: Map<string, WorkoutLog>) {
  const total = plan ? plan.weeks.reduce((n, w) => n + w.sessions.length, 0) : 0;
  const completed = plan ? plan.weeks.reduce((n, w) => n + w.sessions.filter((s) => done.has(s.id)).length, 0) : 0;
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export const SESSION_TYPE_LABEL: Record<SessionType, { fr: string; en: string }> = {
  endurance: { fr: 'Endurance', en: 'Easy run' },
  fractionne: { fr: 'Fractionné', en: 'Intervals' },
  seuil: { fr: 'Seuil', en: 'Threshold' },
  longue: { fr: 'Sortie longue', en: 'Long run' },
  repos: { fr: 'Récupération', en: 'Recovery' },
};

export const SOURCE_LABEL = {
  gemini: 'Google Gemini',
  granite: 'IBM Granite',
  'rules-engine': { fr: 'Moteur de règles ThusStride', en: 'ThusStride rules engine' },
} as const;

export function sourceLabel(source: string | null | undefined, lang: 'fr' | 'en'): string {
  if (source === 'gemini') return SOURCE_LABEL.gemini;
  if (source === 'granite') return SOURCE_LABEL.granite;
  if (source === 'rules-engine') return SOURCE_LABEL['rules-engine'][lang];
  return lang === 'fr' ? 'Indisponible' : 'Unavailable';
}

export function sessionDistance(s: WorkoutSession) {
  return s.distanceKm ? `${s.distanceKm} km` : '—';
}

export function downloadFile(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function planToMarkdown(plan: TrainingPlan, athlete: string, lang: 'fr' | 'en') {
  const L = (fr: string, en: string) => (lang === 'fr' ? fr : en);
  let md = `# ThusStride – ${plan.objectiveLabel}\n\n`;
  md += `- ${L('Athlète', 'Athlete')} : ${athlete}\n- ${L('Niveau', 'Level')} : ${plan.levelLabel}\n`;
  md += `- ${L('Généré le', 'Generated on')} : ${new Date(plan.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}\n\n`;
  md += `> ${plan.coachTips}\n\n`;
  for (const w of plan.weeks) {
    md += `## ${L('Semaine', 'Week')} ${w.weekNumber} – ${w.focus}\n\n`;
    for (const s of w.sessions) {
      md += `### ${s.day} – ${s.title}\n`;
      md += `- ${L('Durée', 'Duration')} : ${s.durationMinutes} min${s.distanceKm ? ` · ~${s.distanceKm} km` : ''}\n`;
      md += `- ${L('Intensité', 'Intensity')} : ${s.intensityPercent} % ${L('FC de réserve', 'HR reserve')}\n`;
      md += `- ${s.description}\n`;
      if (s.warmup) md += `- ${L('Échauffement', 'Warm-up')} : ${s.warmup}\n`;
      if (s.cooldown) md += `- ${L('Retour au calme', 'Cool-down')} : ${s.cooldown}\n`;
      md += '\n';
    }
  }
  return md;
}
