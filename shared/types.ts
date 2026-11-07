import type { AI_PROVIDERS, COACH_IDS, LANGUAGES, LEVELS, OBJECTIVES, SESSION_TYPES } from './schemas';

export type Level = (typeof LEVELS)[number];
export type Objective = (typeof OBJECTIVES)[number];
export type SessionType = (typeof SESSION_TYPES)[number];
export type CoachId = (typeof COACH_IDS)[number];
export type AiProvider = (typeof AI_PROVIDERS)[number];
export type Language = (typeof LANGUAGES)[number];
export type Role = 'athlete' | 'admin';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  language: Language;
  remindersEnabled: boolean;
  reminderTime: string;
  createdAt: string;
  hasProfile: boolean;
}

export interface UserProfile {
  age: number;
  level: Level;
  frequency: number;
  avgDistance: number;
  objective: Objective;
  customObjective: string;
  injuryHistory: string;
  restingHr: number | null;
  maxHr: number | null;
  weightKg: number | null;
  coachId: CoachId;
  aiProvider: AiProvider;
  updatedAt?: string;
}

export interface WorkoutSession {
  id: string;
  day: string;
  type: SessionType;
  title: string;
  description: string;
  durationMinutes: number;
  distanceKm?: number;
  intensityPercent: number;
  warmup?: string;
  cooldown?: string;
}

export interface WeeklyPlan {
  weekNumber: number;
  focus: string;
  sessions: WorkoutSession[];
}

/** Where a plan or an answer actually came from. Always truthful. */
export type ContentSource = 'gemini' | 'granite' | 'rules-engine';

export interface TrainingPlan {
  id: string;
  objectiveLabel: string;
  levelLabel: string;
  coachTips: string;
  weeks: WeeklyPlan[];
  source: ContentSource;
  coachId: CoachId;
  isActive: boolean;
  createdAt: string;
}

export interface PlanSummary {
  id: string;
  objectiveLabel: string;
  levelLabel: string;
  source: ContentSource;
  isActive: boolean;
  createdAt: string;
  totalSessions: number;
  completedSessions: number;
}

export interface WorkoutLog {
  id: string;
  planId: string;
  sessionId: string;
  sessionTitle: string;
  sessionType: SessionType;
  plannedDurationMinutes: number;
  fatigue: number | null;
  actualDurationMinutes: number | null;
  actualDistanceKm: number | null;
  avgHr: number | null;
  notes: string;
  advice: string | null;
  adviceSource: ContentSource | null;
  completedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  coachId: CoachId;
  source: ContentSource | null;
  createdAt: string;
}

export interface DashboardStats {
  totalWorkouts: number;
  totalMinutes: number;
  totalDistanceKm: number;
  avgFatigue: number | null;
  currentStreakDays: number;
  weekly: { weekStart: string; minutes: number; distanceKm: number; workouts: number; avgFatigue: number | null }[];
}

export interface AdminStats {
  users: number;
  newUsers7d: number;
  plans: number;
  workouts: number;
  chatMessages: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  lastLoginAt: string | null;
  plans: number;
  workouts: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
