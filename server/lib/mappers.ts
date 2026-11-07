import type {
  ChatMessagesTable,
  PlansTable,
  ProfilesTable,
  UsersTable,
  WorkoutLogsTable,
} from '../db/schema';
import type {
  ChatMessage,
  CoachId,
  ContentSource,
  PublicUser,
  TrainingPlan,
  UserProfile,
  WeeklyPlan,
  WorkoutLog,
} from '../../shared/types';

export function toPublicUser(u: UsersTable, hasProfile: boolean): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    language: u.language,
    remindersEnabled: Boolean(u.reminders_enabled),
    reminderTime: u.reminder_time,
    createdAt: u.created_at,
    hasProfile,
  };
}

export function toProfile(p: ProfilesTable): UserProfile {
  return {
    age: p.age,
    level: p.level as UserProfile['level'],
    frequency: p.frequency,
    avgDistance: Number(p.avg_distance),
    objective: p.objective as UserProfile['objective'],
    customObjective: p.custom_objective,
    injuryHistory: p.injury_history,
    restingHr: p.resting_hr,
    maxHr: p.max_hr,
    weightKg: p.weight_kg == null ? null : Number(p.weight_kg),
    coachId: p.coach_id as CoachId,
    aiProvider: p.ai_provider as UserProfile['aiProvider'],
    updatedAt: p.updated_at,
  };
}

export function toPlan(p: PlansTable): TrainingPlan {
  return {
    id: p.id,
    objectiveLabel: p.objective_label,
    levelLabel: p.level_label,
    coachTips: p.coach_tips,
    weeks: JSON.parse(p.weeks_json) as WeeklyPlan[],
    source: p.source as ContentSource,
    coachId: p.coach_id as CoachId,
    isActive: Boolean(p.is_active),
    createdAt: p.created_at,
  };
}

export function toWorkoutLog(w: WorkoutLogsTable): WorkoutLog {
  return {
    id: w.id,
    planId: w.plan_id,
    sessionId: w.session_id,
    sessionTitle: w.session_title,
    sessionType: w.session_type as WorkoutLog['sessionType'],
    plannedDurationMinutes: w.planned_duration_minutes,
    fatigue: w.fatigue,
    actualDurationMinutes: w.actual_duration_minutes,
    actualDistanceKm: w.actual_distance_km == null ? null : Number(w.actual_distance_km),
    avgHr: w.avg_hr,
    notes: w.notes,
    advice: w.advice,
    adviceSource: w.advice_source as ContentSource | null,
    completedAt: w.completed_at,
  };
}

export function toChatMessage(m: ChatMessagesTable): ChatMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    coachId: m.coach_id as CoachId,
    source: m.source as ContentSource | null,
    createdAt: m.created_at,
  };
}
