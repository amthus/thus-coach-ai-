/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TrainingPlan, WorkoutSession, SessionType } from '../types';
import { CheckCircle2, ChevronRight, Zap, Target, Moon, Award, Info, Flame, Eye, Dumbbell } from 'lucide-react';

interface Props {
  plan: TrainingPlan;
  completedSessions: Record<string, boolean>;
  onToggleSession: (sessionId: string) => void;
}

export default function TrainingPlanDisplay({ plan, completedSessions, onToggleSession }: Props) {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [activeWeek, setActiveWeek] = useState<number>(1);

  // Total workouts count across all weeks
  const allSessions = plan.weeks.flatMap(w => w.sessions);
  const totalCount = allSessions.length;
  const completedCount = allSessions.filter(s => completedSessions[s.id]).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getSessionIcon = (type: SessionType) => {
    switch (type) {
      case 'fractionne':
        return <Zap className="w-4 h-4 text-rose-500" />;
      case 'seuil':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'longue':
        return <Target className="w-4 h-4 text-blue-400" />;
      case 'repos':
        return <Moon className="w-4 h-4 text-white/40" />;
      case 'endurance':
      default:
        return <Award className="w-4 h-4 text-[#CCFF00]" />;
    }
  };

  const getSessionBadgeColor = (type: SessionType) => {
    switch (type) {
      case 'fractionne':
        return 'bg-rose-600 text-white font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded-none';
      case 'seuil':
        return 'bg-amber-500 text-black font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded-none';
      case 'longue':
        return 'bg-blue-600 text-white font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded-none';
      case 'repos':
        return 'border border-white/20 text-white/50 font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded-none';
      case 'endurance':
      default:
        return 'bg-[#CCFF00] text-black font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded-none';
    }
  };

  const currentWeekPlan = plan.weeks.find(w => w.weekNumber === activeWeek) || plan.weeks[0];

  return (
    <div id="training-plan" className="space-y-6">
      {/* Progess and Highlevel view */}
      <div className="bg-[#0F0F0F] border border-white/10 p-6 relative overflow-hidden">
        {/* Absolute branding line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00]" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="space-y-1.5">
            <span className="text-[9px] bg-[#CCFF00] text-black font-black px-2.5 py-0.5 rounded-none uppercase tracking-widest inline-block">
              ATHLETIC PROTOCOL ACTIVATED
            </span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-white uppercase tracking-tighter italic leading-none">{plan.objectiveLabel}</h2>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">CALIBRE D'ATHLETE : {plan.levelLabel}</p>
          </div>
          
          {/* Progress bar */}
          <div className="lg:w-80 bg-black/40 border border-white/10 p-4 rounded-none flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-white/40 mb-1.5">
                <span>PROGRESS REGISTER</span>
                <span className="text-[#CCFF00]">{completedCount} / {totalCount} SESSIONS</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-none overflow-hidden">
                <div 
                  className="bg-[#CCFF00] h-1.5 transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="bg-[#CCFF00] text-black rounded-none px-2.5 py-2 font-mono font-black text-xl text-center leading-none min-w-[55px] shadow-[0_0_10px_rgba(204,255,0,0.3)]">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Coach Advice Bubble */}
        <div className="bg-black/40 border border-white/10 p-4 flex gap-3 text-xs text-white/70 rounded-none leading-relaxed uppercase font-mono">
          <Info className="w-5 h-5 text-[#CCFF00] shrink-0" />
          <div>
            <strong className="text-white font-black text-[#CCFF00]">CONSIGNE GLOBALE :</strong> {plan.coachTips}
          </div>
        </div>
      </div>

      {/* Week Selector Tab */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {plan.weeks.map((w) => (
          <button
            key={w.weekNumber}
            id={`tab-week-${w.weekNumber}`}
            onClick={() => setActiveWeek(w.weekNumber)}
            className={`px-5 py-3 rounded-none font-display font-black transition-all shrink-0 text-[10px] uppercase tracking-widest border ${
              activeWeek === w.weekNumber
                ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                : 'bg-[#0F0F0F] text-white/40 border-white/10 hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            Semaine {w.weekNumber}
          </button>
        ))}
      </div>

      {/* Week Details & Sessions Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sessions list */}
        <div className="xl:col-span-2 space-y-2.5">
          <div className="bg-[#1A1A1A] border border-white/10 p-3.5 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              FOCUS TECHNIQUE HEBDOMADAIRE :
            </span>
            <span className="text-xs font-mono font-black text-[#CCFF00] uppercase tracking-wide">
              {currentWeekPlan.focus}
            </span>
          </div>

          {currentWeekPlan.sessions.map((session) => {
            const isCompleted = completedSessions[session.id] || false;
            const isSelected = selectedSession?.id === session.id;
            return (
              <div 
                key={session.id}
                id={`session-card-${session.id}`}
                className={`bg-[#0F0F0F] border transition-all rounded-none p-4 flex items-center justify-between gap-4 group cursor-pointer relative ${
                  isSelected 
                    ? 'border-[#CCFF00] bg-white/[0.02]' 
                    : isCompleted 
                      ? 'border-emerald-500/30 bg-black/20'
                      : 'border-white/10 hover:border-white/30'
                }`}
                onClick={() => setSelectedSession(session)}
              >
                {/* Visual left dynamic border highlight */}
                <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${
                  isSelected ? 'bg-[#CCFF00]' : isCompleted ? 'bg-emerald-500' : 'bg-transparent'
                }`} />

                <div className="flex items-center gap-3.5 min-w-0 flex-1 pl-1">
                  {/* Styled Checkbox */}
                  <button
                    id={`complete-btn-${session.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSession(session.id);
                    }}
                    className={`shrink-0 transition-transform hover:scale-105 p-1.5 rounded-none ${
                      isCompleted 
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' 
                        : 'text-white/30 bg-black border border-white/15 hover:border-[#CCFF00] hover:text-[#CCFF00]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 fill-current bg-transparent" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00] font-mono">
                        {session.day}
                      </span>
                      <span className={getSessionBadgeColor(session.type)}>
                        {session.type === 'endurance' ? 'Endurance' : 
                         session.type === 'fractionne' ? 'Fractionné' : 
                         session.type === 'seuil' ? 'Seuil' : 
                         session.type === 'longue' ? 'Sortie Longue' : 'Repos'}
                      </span>
                    </div>
                    <h4 className={`text-base font-black uppercase tracking-tight mt-1 truncate font-display ${isCompleted ? 'text-white/35 line-through' : 'text-white'}`}>
                      {session.title}
                    </h4>
                    <p className="text-[11px] text-white/50 uppercase font-mono mt-0.5 line-clamp-1">
                      {session.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                  <div className="text-right">
                    <span className="text-[#CCFF00] font-black block leading-none">{session.durationMinutes} MIN</span>
                    {session.distanceKm && (
                      <span className="text-[10px] text-white/40 block mt-1 uppercase font-bold">{session.distanceKm} KM_EST</span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-none bg-black border border-white/15 flex items-center justify-center">
                    {getSessionIcon(session.type)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Session Details Panel */}
        <div id="session-details-panel" className="bg-[#0F0F0F] border border-white/10 p-5 rounded-none min-h-[350px] flex flex-col relative overflow-hidden">
          {selectedSession ? (
            <div className="flex-1 flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase font-black text-[#CCFF00] tracking-widest">{selectedSession.day}</span>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tighter italic mt-0.5">{selectedSession.title}</h3>
                </div>
                <span className={getSessionBadgeColor(selectedSession.type)}>
                  {selectedSession.type}
                </span>
              </div>

              <div className="space-y-4 flex-1">
                {/* Description */}
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">Fiche de prescription</h4>
                  <p className="text-xs text-white bg-[#1A1A1A] p-3.5 border border-white/10 leading-relaxed uppercase font-mono">
                    {selectedSession.description}
                  </p>
                </div>

                {/* Intensity Indicator */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 p-3 border border-white/10 rounded-none">
                    <span className="text-[9px] uppercase tracking-widest font-black text-white/40 block">METRIC INTENSITÉ</span>
                    <span className="text-sm font-black text-[#CCFF00] font-mono flex items-center gap-1.5 mt-1 leading-none uppercase">
                      <Flame className="w-4 h-4 text-amber-500" />
                      {selectedSession.intensityPercent}% FCM
                    </span>
                  </div>
                  <div className="bg-black/40 p-3 border border-white/10 rounded-none">
                    <span className="text-[9px] uppercase tracking-widest font-black text-white/40 block">CHRONOMETRIE</span>
                    <span className="text-sm font-black text-white font-mono flex items-center gap-1.5 mt-1 leading-none uppercase">
                      <Dumbbell className="w-4 h-4 text-white" />
                      {selectedSession.durationMinutes} MIN
                    </span>
                  </div>
                </div>

                {/* Technical Protocol Warmup / Cooldown */}
                <div className="space-y-2.5 pt-1">
                  {selectedSession.warmup && (
                    <div className="border-l-2 border-[#CCFF00] bg-white/[0.01] p-2 pl-3">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-[#CCFF00]">ÉCHAUFFEMENT PROGRESSIF :</h5>
                      <p className="text-[10px] uppercase font-mono text-white/60 mt-0.5 leading-normal">{selectedSession.warmup}</p>
                    </div>
                  )}

                  {selectedSession.cooldown && (
                    <div className="border-l-2 border-white/20 bg-white/[0.01] p-2 pl-3">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-white/40">COOLDOWN / RECUP :</h5>
                      <p className="text-[10px] uppercase font-mono text-white/60 mt-0.5 leading-normal">{selectedSession.cooldown}</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                id={`detail-toggle-${selectedSession.id}`}
                onClick={() => onToggleSession(selectedSession.id)}
                className={`w-full py-4 px-4 font-black text-[10px] uppercase tracking-widest transition-all rounded-none mt-auto border ${
                  completedSessions[selectedSession.id]
                    ? 'bg-transparent border-[#CCFF00]/40 text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black'
                    : 'bg-[#CCFF00] text-black border-[#CCFF00] hover:bg-white hover:text-black shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                }`}
              >
                {completedSessions[selectedSession.id] ? '✓ SESSION EFFECTUÉE (ARCHIVER)' : 'VALIDER LA SESSION'}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/40">
              <Eye className="w-10 h-10 text-white/20 mb-3" />
              <p className="font-display font-black uppercase tracking-wider text-white mb-1">PROTOCOLE INACTIF</p>
              <p className="text-[10px] font-mono uppercase text-white/40 max-w-[200px] leading-relaxed">
                Sélectionnez l'une de vos sessions d'entraînement à gauche afin de calibrer les seuils cardiaques prescrits par le coach.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
