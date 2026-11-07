/**
 * Validation schemas shared by the API server and the web client.
 * Single source of truth for every payload crossing the network boundary.
 */
import { z } from 'zod';

export const LEVELS = ['debutant', 'intermediaire', 'avance'] as const;
export const OBJECTIVES = ['sante', '5k', '10k', 'semi', 'marathon', 'vitesse'] as const;
export const SESSION_TYPES = ['endurance', 'fractionne', 'seuil', 'longue', 'repos'] as const;
export const COACH_IDS = ['michel', 'helene', 'chloe'] as const;
export const AI_PROVIDERS = ['gemini', 'granite'] as const;
export const LANGUAGES = ['fr', 'en'] as const;

const trimmed = (max: number) => z.string().trim().max(max);

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z
  .string()
  .min(10, 'password_too_short')
  .max(128)
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), 'password_too_weak');

export const RegisterSchema = z.object({
  name: trimmed(80).min(2),
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal(true),
  healthDataConsent: z.literal(true),
  language: z.enum(LANGUAGES).default('fr'),
});

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const ForgotPasswordSchema = z.object({ email: emailSchema });
export const ResetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
});
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export const ProfileSchema = z.object({
  age: z.coerce.number().int().min(14).max(90),
  level: z.enum(LEVELS),
  frequency: z.coerce.number().int().min(1).max(6),
  avgDistance: z.coerce.number().min(1).max(50),
  objective: z.enum(OBJECTIVES),
  customObjective: trimmed(200).optional().default(''),
  injuryHistory: trimmed(300).optional().default(''),
  restingHr: z.coerce.number().int().min(30).max(120).nullable().optional(),
  maxHr: z.coerce.number().int().min(120).max(230).nullable().optional(),
  weightKg: z.coerce.number().min(30).max(250).nullable().optional(),
  coachId: z.enum(COACH_IDS).default('michel'),
  aiProvider: z.enum(AI_PROVIDERS).default('gemini'),
});

export const SettingsSchema = z.object({
  name: trimmed(80).min(2).optional(),
  language: z.enum(LANGUAGES).optional(),
  remindersEnabled: z.boolean().optional(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
});

export const SessionSchema = z.object({
  id: z.string().min(1).max(40),
  day: trimmed(30),
  type: z.enum(SESSION_TYPES),
  title: trimmed(120),
  description: trimmed(1200),
  durationMinutes: z.coerce.number().int().min(0).max(400),
  distanceKm: z.coerce.number().min(0).max(100).optional(),
  intensityPercent: z.coerce.number().int().min(0).max(100),
  warmup: trimmed(400).optional(),
  cooldown: trimmed(400).optional(),
});

export const WeekSchema = z.object({
  weekNumber: z.coerce.number().int().min(1).max(52),
  focus: trimmed(200),
  sessions: z.array(SessionSchema).min(1).max(7),
});

/** Shape returned by an AI model or the rules engine, before persistence. */
export const GeneratedPlanSchema = z.object({
  objectiveLabel: trimmed(160),
  levelLabel: trimmed(120),
  coachTips: trimmed(2000),
  weeks: z.array(WeekSchema).min(1).max(16),
});

export const WorkoutLogSchema = z.object({
  planId: z.string().uuid(),
  sessionId: z.string().min(1).max(40),
  fatigue: z.coerce.number().int().min(1).max(10).nullable().optional(),
  actualDurationMinutes: z.coerce.number().int().min(0).max(600).nullable().optional(),
  actualDistanceKm: z.coerce.number().min(0).max(200).nullable().optional(),
  avgHr: z.coerce.number().int().min(40).max(230).nullable().optional(),
  notes: trimmed(1000).optional().default(''),
});

export const WorkoutLogUpdateSchema = WorkoutLogSchema.omit({ planId: true, sessionId: true }).partial();

export const ChatSchema = z.object({
  message: trimmed(2000).min(1),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
export type SettingsInput = z.infer<typeof SettingsSchema>;
export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;
export type WorkoutLogInput = z.infer<typeof WorkoutLogSchema>;
