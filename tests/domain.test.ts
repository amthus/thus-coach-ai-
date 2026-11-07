import { describe, expect, it } from 'vitest';
import {
  estimateMaxHr,
  estimateVo2Max,
  formatPace,
  karvonenTarget,
  karvonenZones,
  paceToSpeed,
  riegelPredict,
  speedToPace,
} from '../shared/physiology';
import { GeneratedPlanSchema, type ProfileInput } from '../shared/schemas';
import { generateRulesPlan, rulesFatigueAdvice } from '../server/services/planEngine';
import { computeStats, normalizePlan } from '../server/routes/training';
import { extractJson, sanitizeForPrompt } from '../server/services/ai';
import { renderSeoHead } from '../server/seo';

const base: ProfileInput = {
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

describe('physiology', () => {
  it('computes Tanaka max HR and Karvonen zones', () => {
    expect(estimateMaxHr(30)).toBe(187);
    const zones = karvonenZones(190, 60);
    expect(zones).toHaveLength(5);
    expect(zones[1]).toMatchObject({ zone: 2, minBpm: 138, maxBpm: 151 });
    expect(karvonenTarget(190, 60, 70)).toBe(151);
  });

  it('estimates VO2max only when resting HR is measured', () => {
    expect(estimateVo2Max(190, null)).toBeNull();
    expect(estimateVo2Max(190, 50)).toBeCloseTo(58.1, 1);
  });

  it('converts pace and predicts race times', () => {
    expect(paceToSpeed(300)).toBe(12);
    expect(speedToPace(12)).toBe(300);
    expect(formatPace(330)).toBe('5:30');
    expect(formatPace(0)).toBe('--:--');
    expect(Math.round(riegelPredict(25 * 60, 5, 10))).toBe(3127);
  });
});

describe('rules plan engine', () => {
  it.each([1, 2, 3, 4, 5, 6])('produces a valid 4-week plan for %i sessions/week', (frequency) => {
    for (const level of ['debutant', 'intermediaire', 'avance'] as const) {
      const plan = generateRulesPlan({ ...base, frequency, level });
      expect(GeneratedPlanSchema.safeParse(plan).success).toBe(true);
      expect(plan.weeks).toHaveLength(4);
      plan.weeks.forEach((w) => expect(w.sessions).toHaveLength(frequency));
    }
  });

  it('never schedules intensity for beginners in week 1 nor with an injury history', () => {
    const beginner = generateRulesPlan({ ...base, level: 'debutant', frequency: 4 });
    expect(beginner.weeks[0].sessions.some((s) => ['fractionne', 'seuil'].includes(s.type))).toBe(false);
    const injured = generateRulesPlan({ ...base, level: 'avance', frequency: 5, injuryHistory: 'genou' });
    expect(injured.weeks.flatMap((w) => w.sessions).some((s) => ['fractionne', 'seuil'].includes(s.type))).toBe(false);
  });

  it('progresses volume by at most ~10 % per week and deloads in week 4', () => {
    const plan = generateRulesPlan({ ...base, level: 'intermediaire', frequency: 4 });
    const vol = plan.weeks.map((w) => w.sessions.reduce((s, x) => s + x.durationMinutes, 0));
    expect(vol[1] / vol[0]).toBeLessThanOrEqual(1.12);
    expect(vol[3]).toBeLessThan(vol[2]);
  });

  it('gives graded fatigue advice', () => {
    expect(rulesFatigueAdvice(9, 'endurance')).toMatch(/48 h/);
    expect(rulesFatigueAdvice(7, 'seuil')).toMatch(/15 à 20 %/);
    expect(rulesFatigueAdvice(2, 'endurance', 'en')).toMatch(/Great/);
  });

  it('normalises session ids to be unique', () => {
    const plan = generateRulesPlan(base);
    plan.weeks[0].sessions[0].id = 'dup';
    plan.weeks[1].sessions[0].id = 'dup';
    const ids = normalizePlan(plan).weeks.flatMap((w) => w.sessions.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('stats', () => {
  it('computes totals, weekly buckets and streaks', () => {
    const now = new Date('2026-11-07T12:00:00Z');
    const stats = computeStats(
      [
        { completed_at: '2026-11-05T08:00:00Z', actual_duration_minutes: 40, planned_duration_minutes: 45, actual_distance_km: 6, fatigue: 4 },
        { completed_at: '2026-11-06T08:00:00Z', actual_duration_minutes: null, planned_duration_minutes: 30, actual_distance_km: null, fatigue: 6 },
        { completed_at: '2026-11-07T08:00:00Z', actual_duration_minutes: 50, planned_duration_minutes: 50, actual_distance_km: 8.2, fatigue: null },
      ],
      now,
    );
    expect(stats).toMatchObject({ totalWorkouts: 3, totalMinutes: 120, totalDistanceKm: 14.2, avgFatigue: 5, currentStreakDays: 3 });
    expect(stats.weekly.at(-1)).toMatchObject({ weekStart: '2026-11-02', workouts: 3, minutes: 120 });
  });
});

describe('ai helpers', () => {
  it('extracts JSON from fenced or noisy model output', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Voici : {"a":2} merci')).toEqual({ a: 2 });
    expect(extractJson('rien')).toBeNull();
  });
  it('sanitises user text injected into prompts', () => {
    expect(sanitizeForPrompt('a`b<c>\n\nd', 10)).toBe('a b c d');
  });
});

describe('seo', () => {
  const tpl = '<head><!--seo:start--><title>x</title><!--seo:end--></head>';
  it('injects route metadata and canonical URLs', () => {
    const { html, status } = renderSeoHead(tpl, '/fonctionnalites', 'https://thusstride.app');
    expect(status).toBe(200);
    expect(html).toContain('<link rel="canonical" href="https://thusstride.app/fonctionnalites" />');
    expect(html).toContain('index, follow');
    expect(html).toContain('og:image" content="https://thusstride.app/og-image.png"');
  });
  it('marks private pages noindex and unknown pages 404', () => {
    expect(renderSeoHead(tpl, '/app/plan', 'https://x').html).toContain('noindex');
    expect(renderSeoHead(tpl, '/does-not-exist', 'https://x').status).toBe(404);
  });
});

describe('typography', () => {
  it('replaces long dashes in AI output with a simple hyphen', async () => {
    const { normalizeDashes } = await import('../server/services/ai');
    const em = String.fromCharCode(0x2014);
    const en = String.fromCharCode(0x2013);
    expect(normalizeDashes(`Endurance ${em} zone 2${en}3`)).toBe('Endurance - zone 2 - 3');
  });
});
