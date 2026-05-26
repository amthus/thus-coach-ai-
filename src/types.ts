/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  age: number;
  level: 'debutant' | 'intermediaire' | 'avance';
  frequency: number; // sessions per week
  avgDistance: number; // in km
  objective: 'sante' | '5k' | '10k' | 'semi' | 'marathon' | 'vitesse';
  customObjective?: string;
  injuryHistory?: string;
}

export type SessionType = 'endurance' | 'fractionne' | 'seuil' | 'longue' | 'repos';

export interface WorkoutSession {
  id: string;
  day: string; // e.g. "Lundi", "Mercredi", "Samedi", "Dimanche"
  type: SessionType;
  title: string;
  description: string;
  durationMinutes: number;
  distanceKm?: number;
  intensityPercent: number; // 0 to 100
  warmup?: string;
  cooldown?: string;
  completed?: boolean;
}

export interface WeeklyPlan {
  weekNumber: number;
  focus: string;
  sessions: WorkoutSession[];
}

export interface TrainingPlan {
  id: string;
  objectiveLabel: string;
  levelLabel: string;
  coachTips: string;
  weeks: WeeklyPlan[];
}

export interface CoachPersona {
  id: string;
  name: string;
  avatar: string;
  description: string;
  style: string; // friendly, tech, strict
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export interface ReadmeTemplate {
  title: string;
  problem: string;
  solution: string;
  aiApproach: string;
  impact: string;
}
