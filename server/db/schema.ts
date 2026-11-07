/**
 * Database table typings. The schema is deliberately portable (PostgreSQL + SQLite):
 * - ids are application-generated UUID strings
 * - timestamps are ISO-8601 strings
 * - booleans are stored as 0/1 integers
 * - structured payloads are stored as JSON text
 */
import type { Generated } from 'kysely';

export interface UsersTable {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'athlete' | 'admin';
  language: 'fr' | 'en';
  reminders_enabled: number;
  reminder_time: string;
  terms_accepted_at: string;
  health_consent_at: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AuthSessionsTable {
  id: string; // sha256(token)
  user_id: string;
  created_at: string;
  expires_at: string;
  user_agent: string | null;
}

export interface PasswordResetsTable {
  id: string; // sha256(token)
  user_id: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface ProfilesTable {
  user_id: string;
  age: number;
  level: string;
  frequency: number;
  avg_distance: number;
  objective: string;
  custom_objective: string;
  injury_history: string;
  resting_hr: number | null;
  max_hr: number | null;
  weight_kg: number | null;
  coach_id: string;
  ai_provider: string;
  updated_at: string;
}

export interface PlansTable {
  id: string;
  user_id: string;
  objective_label: string;
  level_label: string;
  coach_tips: string;
  weeks_json: string;
  source: string;
  coach_id: string;
  is_active: number;
  created_at: string;
}

export interface WorkoutLogsTable {
  id: string;
  user_id: string;
  plan_id: string;
  session_id: string;
  session_title: string;
  session_type: string;
  planned_duration_minutes: number;
  fatigue: number | null;
  actual_duration_minutes: number | null;
  actual_distance_km: number | null;
  avg_hr: number | null;
  notes: string;
  advice: string | null;
  advice_source: string | null;
  completed_at: string;
}

export interface ChatMessagesTable {
  id: string;
  user_id: string;
  role: 'user' | 'coach';
  content: string;
  coach_id: string;
  source: string | null;
  created_at: string;
}

export interface MigrationsTable {
  name: string;
  applied_at: string;
}

export interface Database {
  users: UsersTable;
  auth_sessions: AuthSessionsTable;
  password_resets: PasswordResetsTable;
  profiles: ProfilesTable;
  plans: PlansTable;
  workout_logs: WorkoutLogsTable;
  chat_messages: ChatMessagesTable;
  app_migrations: MigrationsTable;
}

// Re-exported for convenience in case auto-increment columns are added later.
export type { Generated };
