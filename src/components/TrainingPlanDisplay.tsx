/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { TrainingPlan, WorkoutSession, SessionType } from '../types';
import { CheckCircle2, Zap, Target, Moon, Award, Info, Flame, Eye, Dumbbell, Printer, List, X, Copy, Calendar as CalendarIcon } from 'lucide-react';
import { i18n, Language } from '../i18n';

// Static assets generated for route visualization
// @ts-ignore
import routeMapIntervals from '../assets/images/route_map_intervals_1779839046409.png';
// @ts-ignore
import routeMapEndurance from '../assets/images/route_map_endurance_1779839062267.png';
// @ts-ignore
import routeMapThreshold from '../assets/images/route_map_threshold_1779839078159.png';
// @ts-ignore
import routeMapRecovery from '../assets/images/route_map_recovery_1779839092824.png';

interface Props {
  plan: TrainingPlan;
  completedSessions: Record<string, boolean>;
  onToggleSession: (sessionId: string) => void;
  language: Language;
  sessionFatigue?: Record<string, number>;
  fatigueRecommendations?: Record<string, string>;
  athleteAge?: number;
  athleteEmail?: string;
}

const dayTranslations: Record<string, Record<Language, string>> = {
  'Lundi': { fr: 'Lundi', en: 'Monday' },
  'Mardi': { fr: 'Mardi', en: 'Tuesday' },
  'Mercredi': { fr: 'Mercredi', en: 'Wednesday' },
  'Jeudi': { fr: 'Jeudi', en: 'Thursday' },
  'Vendredi': { fr: 'Vendredi', en: 'Friday' },
  'Samedi': { fr: 'Samedi', en: 'Saturday' },
  'Dimanche': { fr: 'Dimanche', en: 'Sunday' },
};

export default function TrainingPlanDisplay({ 
  plan, 
  completedSessions, 
  onToggleSession, 
  language,
  sessionFatigue,
  fatigueRecommendations,
  athleteAge,
  athleteEmail
}: Props) {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);
  
  const t = i18n[language];

  const getRouteMapImage = (type: SessionType) => {
    switch (type) {
      case 'fractionne':
        return routeMapIntervals;
      case 'seuil':
        return routeMapThreshold;
      case 'longue':
      case 'endurance':
        return routeMapEndurance;
      case 'repos':
      default:
        return routeMapRecovery;
    }
  };

  const getFullMarkdown = () => {
    let md = `# STRIDE_AI ATHLETIC PLAN: ${plan.objectiveLabel}\n`;
    md += `Athlete Level: ${plan.levelLabel}\n`;
    md += `Athlete Email: ${athleteEmail || 'learninhack@gmail.com'}\n`;
    md += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    md += `Coach Advice: ${plan.coachTips}\n\n`;
    
    plan.weeks.forEach(w => {
      md += `## Week ${w.weekNumber}: ${w.focus}\n\n`;
      w.sessions.forEach(s => {
        md += `### ${s.day} - ${s.title} (${s.type.toUpperCase()})\n`;
        md += `- Duration: ${s.durationMinutes} mins\n`;
        if (s.distanceKm) md += `- Distance Est: ${s.distanceKm} km\n`;
        md += `- Heart Intensity: ${s.intensityPercent}% FCM\n`;
        md += `- Prescription: ${s.description}\n`;
        if (s.warmup) md += `- Warmup: ${s.warmup}\n`;
        if (s.cooldown) md += `- Cooldown: ${s.cooldown}\n`;
        md += `\n`;
      });
    });
    return md;
  };

  const handlePrintTrigger = () => {
    // Check if we are in an iframe sandbox or if print is blocked
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      setShowPrintModal(true);
    } else {
      try {
        window.print();
      } catch (err) {
        console.warn("Print action caught by sandbox constraint:", err);
        setShowPrintModal(true);
      }
    }
  };

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

  const getDayTranslation = (dayStr: string) => {
    const trimmed = dayStr.trim();
    return dayTranslations[trimmed]?.[language] || trimmed;
  };

  const getSessionTypeLabel = (type: SessionType) => {
    switch (type) {
      case 'fractionne':
        return language === 'fr' ? 'Fractionné' : 'Intervals';
      case 'seuil':
        return language === 'fr' ? 'Seuil' : 'Threshold';
      case 'longue':
        return language === 'fr' ? 'Sortie Longue' : 'Long Run';
      case 'repos':
        return language === 'fr' ? 'Repos' : 'Rest';
      case 'endurance':
      default:
        return language === 'fr' ? 'Endurance' : 'Aerobic Base';
    }
  };

  const currentWeekPlan = plan.weeks.find(w => w.weekNumber === activeWeek) || plan.weeks[0];

  return (
    <div id="training-plan" className="space-y-6">
      <div className="bg-[#0F0F0F] border border-white/10 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00]" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="space-y-1.5">
            <span className="text-[9px] bg-[#CCFF00] text-black font-black px-2.5 py-0.5 rounded-none uppercase tracking-widest inline-block">
              {language === 'fr' ? 'PROTOCOLE ATHLÉTIQUE ACTIF' : 'ACTIVE ATHLETIC PROTOCOL'}
            </span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-white uppercase tracking-tighter italic leading-none">{plan.objectiveLabel}</h2>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">
              {language === 'fr' ? "CALIBRE D'ATHLÈTE :" : "ATHLETE DESIGNATION :"} {plan.levelLabel}
            </p>
          </div>
          
          <div className="flex flex-wrap items-stretch sm:items-center gap-3 lg:w-auto w-full">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 sm:flex-initial">
              <button
                id="btn-print-report"
                onClick={handlePrintTrigger}
                className="bg-white/5 hover:bg-[#CCFF00] hover:text-black hover:border-[#CCFF00] border border-white/10 px-4 py-3 text-[10px] uppercase font-black tracking-widest transition-all duration-150 rounded-none cursor-pointer flex items-center justify-center gap-2 flex-1 h-full min-w-[130px]"
                title={language === 'fr' ? 'Imprimer / Exporter en PDF' : 'Print / Export to PDF'}
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>{language === 'fr' ? 'IMPRIMER / PDF' : 'PRINT / PDF'}</span>
              </button>
            </div>

            <div className="lg:w-80 bg-black/40 border border-white/10 p-3 rounded-none flex items-center gap-4 flex-1">
              <div className="flex-1">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-white/40 mb-1.5">
                  <span>{language === 'fr' ? 'REGISTRE DE PROGRESSION' : 'PROGRESSION REGISTER'}</span>
                  <span className="text-[#CCFF00]">{completedCount} / {totalCount} {language === 'fr' ? 'SÉANCES' : 'SESSIONS'}</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-none overflow-hidden">
                  <div 
                    className="bg-[#CCFF00] h-1.5 transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="bg-[#CCFF00] text-black rounded-none px-2 py-1.5 font-mono font-black text-lg text-center leading-none min-w-[50px] shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                {progressPercent}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 p-4 flex gap-3 text-xs text-white/70 rounded-none leading-relaxed uppercase font-mono">
          <Info className="w-5 h-5 text-[#CCFF00] shrink-0" />
          <div>
            <strong className="text-white font-black text-[#CCFF00]">{t.coachTipsTitle}</strong> {plan.coachTips}
          </div>
        </div>
      </div>

      {/* Visual Mode Switching Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-widest text-[#CCFF00] uppercase font-mono block">
            {language === 'fr' ? 'SUIVI DE CHARGE IA' : 'ACTIVE INTAKE CHANNELS'}
          </span>
          <h4 className="text-lg font-black uppercase tracking-tight font-display text-white">
            {plan.objectiveLabel} ({plan.levelLabel})
          </h4>
        </div>
        
        <div className="flex items-center bg-black border border-white/10 p-0.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-all ${
              viewMode === 'list' 
                ? 'bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.2)]' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? 'LISTE DES SÉANCES' : 'WEEKLY LIST'}</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-all ${
              viewMode === 'calendar' 
                ? 'bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.2)]' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? 'CALENDRIER MENSUEL' : 'MONTHLY CALENDAR'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
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
              {language === 'fr' ? `Semaine ${w.weekNumber}` : `Week ${w.weekNumber}`}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid: Left side list/calendar, Right side details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {viewMode === 'list' ? (
            <>
              <div className="bg-[#1A1A1A] border border-white/10 p-3.5 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  {language === 'fr' ? 'FOCUS TECHNIQUE HEBDOMADAIRE :' : 'HEBDOMADARY TECHNICAL FOCUS :'}
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
                    onClick={() => {
                      setSelectedSession(session);
                      setIsWorkoutModalOpen(true);
                    }}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${
                      isSelected ? 'bg-[#CCFF00]' : isCompleted ? 'bg-emerald-500' : 'bg-transparent'
                    }`} />

                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pl-1">
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
                            {getDayTranslation(session.day)}
                          </span>
                          <span className={getSessionBadgeColor(session.type)}>
                            {getSessionTypeLabel(session.type)}
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
            </>
          ) : (
            /* react-calendar Monthly view */
            <div className="bg-[#0F0F0F] border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[10px] font-black tracking-widest text-white/40 uppercase font-mono">
                  {language === 'fr' ? 'CALENDRIER ENTRAÎNEMENT INDEPENDANT' : 'PHYSICAL RUNNING SCHEDULE'}
                </span>
                <span className="text-xs font-mono font-black text-[#CCFF00] uppercase">
                  {language === 'fr' ? 'SÉLECTIONNEZ UNE DATE POUR VOIR LA FICHE' : 'TAP A DATE TO EXPAND THE RUN'}
                </span>
              </div>

              <div className="overflow-hidden border border-white/10">
                <Calendar
                  value={selectedDate}
                  locale={language === 'fr' ? 'fr-FR' : 'en-US'}
                  onChange={(val) => {
                    if (val instanceof Date) {
                      setSelectedDate(val);
                      // Custom date mapping helper logic
                      const d = new Date();
                      const year = d.getFullYear();
                      const month = d.getMonth();
                      const firstDay = new Date(year, month, 1);
                      let dayOfWeek = firstDay.getDay();
                      let offset = 0;
                      if (dayOfWeek === 0) offset = 1;
                      else if (dayOfWeek !== 1) offset = 8 - dayOfWeek;
                      
                      const firstMonday = new Date(year, month, 1 + offset);
                      firstMonday.setHours(0,0,0,0);
                      
                      const targetDate = new Date(val);
                      targetDate.setHours(0,0,0,0);
                      
                      const diffTime = targetDate.getTime() - firstMonday.getTime();
                      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays >= 0 && diffDays < 28) {
                        const weekIndex = Math.floor(diffDays / 7);
                        const dayOfWeekIndex = diffDays % 7;
                        const daysArr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                        const dayStr = daysArr[dayOfWeekIndex];
                        const week = plan.weeks[weekIndex];
                        if (week) {
                          const matchedSession = week.sessions.find(s => s.day.trim().toLowerCase() === dayStr.toLowerCase()) || null;
                          if (matchedSession) {
                            setSelectedSession(matchedSession);
                            setIsWorkoutModalOpen(true);
                          }
                        }
                      }
                    }
                  }}
                  tileClassName={({ date, view }) => {
                    if (view === 'month') {
                      // Custom logic
                      const d = new Date();
                      const year = d.getFullYear();
                      const month = d.getMonth();
                      const firstDay = new Date(year, month, 1);
                      let dayOfWeek = firstDay.getDay();
                      let offset = 0;
                      if (dayOfWeek === 0) offset = 1;
                      else if (dayOfWeek !== 1) offset = 8 - dayOfWeek;
                      
                      const firstMonday = new Date(year, month, 1 + offset);
                      firstMonday.setHours(0,0,0,0);
                      
                      const targetDate = new Date(date);
                      targetDate.setHours(0,0,0,0);
                      
                      const diffTime = targetDate.getTime() - firstMonday.getTime();
                      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays >= 0 && diffDays < 28) {
                        const weekIndex = Math.floor(diffDays / 7);
                        const dayOfWeekIndex = diffDays % 7;
                        const daysArr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                        const dayStr = daysArr[dayOfWeekIndex];
                        const week = plan.weeks[weekIndex];
                        if (week) {
                          const matchedSession = week.sessions.find(s => s.day.trim().toLowerCase() === dayStr.toLowerCase()) || null;
                          if (matchedSession) {
                            return completedSessions[matchedSession.id] 
                              ? 'react-calendar-tile-completed'
                              : matchedSession.type === 'repos'
                                ? 'react-calendar-tile-rest'
                                : 'react-calendar-tile-workout';
                          }
                        }
                      }
                    }
                    return '';
                  }}
                  tileContent={({ date, view }) => {
                    if (view === 'month') {
                      const d = new Date();
                      const year = d.getFullYear();
                      const month = d.getMonth();
                      const firstDay = new Date(year, month, 1);
                      let dayOfWeek = firstDay.getDay();
                      let offset = 0;
                      if (dayOfWeek === 0) offset = 1;
                      else if (dayOfWeek !== 1) offset = 8 - dayOfWeek;
                      
                      const firstMonday = new Date(year, month, 1 + offset);
                      firstMonday.setHours(0,0,0,0);
                      
                      const targetDate = new Date(date);
                      targetDate.setHours(0,0,0,0);
                      
                      const diffTime = targetDate.getTime() - firstMonday.getTime();
                      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays >= 0 && diffDays < 28) {
                        const weekIndex = Math.floor(diffDays / 7);
                        const dayOfWeekIndex = diffDays % 7;
                        const daysArr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                        const dayStr = daysArr[dayOfWeekIndex];
                        const week = plan.weeks[weekIndex];
                        if (week) {
                          const matchedSession = week.sessions.find(s => s.day.trim().toLowerCase() === dayStr.toLowerCase()) || null;
                          if (matchedSession) {
                            return (
                              <div className="flex flex-col items-center justify-center w-full mt-1 shrink-0">
                                <span className={`text-[7px] font-black tracking-tighter px-1 py-0.5 uppercase block ${
                                  completedSessions[matchedSession.id] 
                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                    : matchedSession.type === 'repos'
                                      ? 'bg-white/5 text-white/30' 
                                      : 'bg-[#CCFF00]/10 text-[#CCFF00]'
                                }`}>
                                  W{weekIndex + 1} • {matchedSession.type === 'repos' ? 'REPOS' : `${matchedSession.durationMinutes}m`}
                                </span>
                              </div>
                            );
                          }
                        }
                      }
                    }
                    return null;
                  }}
                />
              </div>

              <div className="border border-white/10 bg-black/40 p-4 text-[10px] font-mono leading-relaxed uppercase space-y-2 text-white/60">
                <div className="flex items-center gap-2 text-[#CCFF00] font-black">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>AIDE À LA LECTURE DU CALENDRIER :</span>
                </div>
                <p>
                  {language === 'fr'
                    ? "Le calendrier cadre automatiquement le plan de 4 semaines sur les 28 jours consécutifs qui débutent au premier lundi du mois en cours. Les bandes de couleurs latérales reflètent votre statut physiologique (Vert = Complété, Jaune = Course planifiée, Gris = Jour de repos prévu)."
                    : "The physical calendar spans your 4-week progression mapping 28 consecutive days beginning on the first Monday of the current month (Green = Checked, Yellow = Active target runs, Outline = Planned rest days)."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div id="session-details-panel" className="bg-[#0F0F0F] border border-white/10 p-5 rounded-none min-h-[350px] flex flex-col relative overflow-hidden">
          {selectedSession ? (
            <div className="flex-1 flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase font-black text-[#CCFF00] tracking-widest">{getDayTranslation(selectedSession.day)}</span>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tighter italic mt-0.5">{selectedSession.title}</h3>
                </div>
                <span className={getSessionBadgeColor(selectedSession.type)}>
                  {getSessionTypeLabel(selectedSession.type)}
                </span>
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">
                    {language === 'fr' ? 'FICHE DE PRESCRIPTION' : 'PRESCRIPTION SUMMARY'}
                  </h4>
                  <p className="text-xs text-white bg-[#1A1A1A] p-3.5 border border-white/10 leading-relaxed uppercase font-mono">
                    {selectedSession.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 p-3 border border-white/10 rounded-none">
                    <span className="text-[9px] uppercase tracking-widest font-black text-white/40 block">
                      {language === 'fr' ? 'METRIQUE INTENSITÉ' : 'INTENSITY METRICS'}
                    </span>
                    <span className="text-sm font-black text-[#CCFF00] font-mono flex items-center gap-1.5 mt-1 leading-none uppercase">
                      <Flame className="w-4 h-4 text-amber-500" />
                      {selectedSession.intensityPercent}% FCM
                    </span>
                  </div>
                  <div className="bg-black/40 p-3 border border-white/10 rounded-none">
                    <span className="text-[9px] uppercase tracking-widest font-black text-white/40 block">
                      {language === 'fr' ? 'CHRONOMÉTRIE' : 'CHRONOMETRICS'}
                    </span>
                    <span className="text-sm font-black text-white font-mono flex items-center gap-1.5 mt-1 leading-none uppercase">
                      <Dumbbell className="w-4 h-4 text-white" />
                      {selectedSession.durationMinutes} MIN
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {selectedSession.warmup && (
                    <div className="border-l-2 border-[#CCFF00] bg-white/[0.01] p-2 pl-3">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-[#CCFF00]">
                        {language === 'fr' ? 'ÉCHAUFFEMENT PROGRESSIF :' : 'PROGRESSIVE WARMUP :'}
                      </h5>
                      <p className="text-[10px] uppercase font-mono text-white/60 mt-0.5 leading-normal">{selectedSession.warmup}</p>
                    </div>
                  )}

                  {selectedSession.cooldown && (
                    <div className="border-l-2 border-white/20 bg-white/[0.01] p-2 pl-3">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-white/40">
                        {language === 'fr' ? 'RÉCUPÉRATION :' : 'COOLDOWN / RECOVERY :'}
                      </h5>
                      <p className="text-[10px] uppercase font-mono text-white/60 mt-0.5 leading-normal">{selectedSession.cooldown}</p>
                    </div>
                  )}
                </div>

                {/* FATIGUE FEEDBACK VIEW */}
                {completedSessions[selectedSession.id] && (
                  <div className="border border-white/10 bg-black/45 p-3.5 space-y-2.5 mt-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-white">
                        {language === 'fr' ? 'Niveau de Fatigue Enregistré' : 'Recorded Fatigue Status'}
                      </h4>
                    </div>
                    {sessionFatigue && sessionFatigue[selectedSession.id] !== undefined ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-white/5 border border-white/10 px-2.5 py-1.5 font-mono">
                          <span className="text-[9px] text-white/40 uppercase">FATIGUE COUREUR :</span>
                          <span className="text-xs font-black text-[#CCFF00]">
                            {sessionFatigue[selectedSession.id]} / 10
                          </span>
                        </div>
                        {fatigueRecommendations && fatigueRecommendations[selectedSession.id] && (
                          <div className="border-l-2 border-[#CCFF00] bg-[#CCFF00]/5 p-2.5 text-[10px] uppercase font-mono text-[#CCFF00] leading-relaxed">
                            <span className="font-extrabold text-white block mb-0.5">💡 AJUSTEMENT IA COACH :</span>
                            {fatigueRecommendations[selectedSession.id]}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[9px] font-mono uppercase text-white/40 leading-relaxed">
                        {language === 'fr' 
                          ? 'Veuillez évaluer votre fatigue (1-10) dans la boîte de dialogue active pour calibrer l\'ajustement de volume.'
                          : 'Rate fatigue (1-10) using the active dialog input to calibrate next week\'s volume.'}
                      </p>
                    )}
                  </div>
                )}
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
                {completedSessions[selectedSession.id] 
                  ? (language === 'fr' ? '✓ SESSION EFFECTUÉE (ARCHIVER)' : '✓ RECORD WORKOUT (ARCHIVE)') 
                  : (language === 'fr' ? 'VALIDER LA SESSION' : 'EXECUTE WORKOUT')}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/40">
              <Eye className="w-10 h-10 text-white/20 mb-3" />
              <p className="font-display font-black uppercase tracking-wider text-white mb-1">
                {language === 'fr' ? 'PROTOCOLE INACTIF' : 'INACTIVE PROTOCOL'}
              </p>
              <p className="text-[10px] font-mono uppercase text-white/40 max-w-[200px] leading-relaxed">
                {language === 'fr' 
                  ? 'Sélectionnez l\'une de vos sessions d\'entraînement à gauche afin de calibrer les seuils cardiaques.'
                  : 'Select one of your targeted running sessions on the left to review physiological presets.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PRINTABLE DEDICATED SHEET */}
      {(() => {
        const ageVal = athleteAge || 30;
        const fcmVal = 220 - ageVal;
        const fcrVal = 60;
        const reserveVal = Math.max(fcmVal - fcrVal, 0);

        const z1Min = Math.round(fcrVal + 0.5 * reserveVal);
        const z1Max = Math.round(fcrVal + 0.6 * reserveVal);
        const z2Min = Math.round(fcrVal + 0.6 * reserveVal);
        const z2Max = Math.round(fcrVal + 0.7 * reserveVal);
        const z3Min = Math.round(fcrVal + 0.7 * reserveVal);
        const z3Max = Math.round(fcrVal + 0.8 * reserveVal);
        const z4Min = Math.round(fcrVal + 0.8 * reserveVal);
        const z4Max = Math.round(fcrVal + 0.9 * reserveVal);
        const z5Min = Math.round(fcrVal + 0.9 * reserveVal);
        const z5Max = Math.round(fcrVal + 1.0 * reserveVal);

        return (
          <div className="hidden print:block bg-white text-black p-8 font-sans uppercase">
            <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black tracking-tight">{plan.objectiveLabel}</h1>
                <p className="text-[10px] font-black mt-1 text-gray-700">
                  ATHLETE DESIGNATION : {plan.levelLabel} • APP: STRIDE_AI CLINICAL SYSTEM REPORT
                </p>
                <p className="text-[9px] font-bold mt-0.5 text-gray-650 font-mono normal-case">
                  ATHLETE NAME: {athleteEmail || 'learninhack@gmail.com'}
                </p>
              </div>
              <div className="text-right font-mono text-[9px] text-gray-500">
                <span>STRIDE_AI v4.2 • {new Date().toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 border border-black bg-gray-50 text-[10px] leading-relaxed font-mono">
                <h3 className="font-black text-xs block mb-1">COACH AI SYSTEM PRECRIPTIONS:</h3>
                <p className="normal-case text-gray-700">{plan.coachTips}</p>
              </div>

              {/* Dynamic printable Heart Rate Zones Summary */}
              <div className="p-4 border border-black bg-gray-50 text-[9px] leading-relaxed font-mono">
                <h3 className="font-black text-xs block mb-1.5 border-b border-black pb-1">
                  {language === 'fr' ? 'ZONES CARDIAQUES DE TARGET (KARVONEN)' : 'TARGET TRAINING HEART ZONES (KARVONEN)'}
                </h3>
                <p className="normal-case text-gray-600 mb-2 leading-none text-[8px]">
                  {language === 'fr' 
                    ? `Fréquence cardiaque maximale calculée : ${fcmVal} BPM. Fréquence cardiaque de repos : 60 BPM.`
                    : `Estimated Max Heart Rate: ${fcmVal} BPM. Resting Heart Rate limit: 60 BPM.`}
                </p>
                <div className="grid grid-cols-5 gap-1 text-center font-bold">
                  <div className="border border-gray-400 p-1 bg-white">
                    <span className="text-[7px] text-gray-500 block">Z1 RECUP</span>
                    <span className="block text-[10px] my-0.5">{z1Min}-{z1Max}</span>
                    <span className="text-[6px] text-gray-400 block">50-60%</span>
                  </div>
                  <div className="border border-gray-400 p-1 bg-white">
                    <span className="text-[7px] text-gray-500 block">Z2 ENDUR</span>
                    <span className="block text-[10px] my-0.5">{z2Min}-{z2Max}</span>
                    <span className="text-[6px] text-gray-400 block">60-70%</span>
                  </div>
                  <div className="border border-gray-400 p-1 bg-white">
                    <span className="text-[7px] text-gray-500 block">Z3 TEMPO</span>
                    <span className="block text-[10px] my-0.5">{z3Min}-{z3Max}</span>
                    <span className="text-[6px] text-gray-400 block">70-80%</span>
                  </div>
                  <div className="border border-gray-400 p-1 bg-white">
                    <span className="text-[7px] text-text-gray-500 block">Z4 SEUIL</span>
                    <span className="block text-[10px] my-0.5">{z4Min}-{z4Max}</span>
                    <span className="text-[6px] text-gray-400 block">80-90%</span>
                  </div>
                  <div className="border border-gray-400 p-1 bg-white">
                    <span className="text-[7px] text-gray-500 block">Z5 VMA</span>
                    <span className="block text-[10px] my-0.5">{z5Min}-{z5Max}</span>
                    <span className="text-[6px] text-gray-400 block">90-100%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {plan.weeks.map((w) => (
                <div key={w.weekNumber} className="border border-gray-400 p-4">
                  <h2 className="text-sm font-black border-b-2 border-black pb-1 mb-3">
                    WEEK {w.weekNumber} - {w.focus}
                  </h2>
                  <table className="w-full text-left font-mono text-[9px] border-collapse">
                    <thead>
                      <tr className="border-b border-black font-black text-[8px]">
                        <th className="py-2 pr-2 w-1/12">{language === 'fr' ? 'JOUR' : 'DAY'}</th>
                        <th className="py-2 pr-2 w-6/12">{language === 'fr' ? 'SÉANCE / CONTENU' : 'WORKOUT DETAILS'}</th>
                        <th className="py-2 pr-2 w-2/12">{language === 'fr' ? 'DURÉE' : 'DURATION'}</th>
                        <th className="py-2 pr-2 w-1/12">{language === 'fr' ? 'DISTANCE EST.' : 'EST. DISTANCE'}</th>
                        <th className="py-2 pr-2 w-2/12">{language === 'fr' ? 'EFFORT CIBLE' : 'TARGET EFFORT'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {w.sessions.map((session) => (
                        <tr key={session.id} className="border-b border-gray-200">
                          <td className="py-2 pr-2 font-bold">{getDayTranslation(session.day)}</td>
                          <td className="py-2 pr-2">
                            <span className="font-bold block text-xs">{session.title}</span>
                            <span className="text-gray-600 block mt-0.5 normal-case">{session.description}</span>
                            {session.warmup && <span className="text-gray-500 block leading-tight text-[8px] mt-1 italic">WUP: {session.warmup}</span>}
                            {completedSessions[session.id] && (
                              <span className="inline-block bg-green-100 text-green-800 text-[7px] px-1 py-0.5 mt-1 font-bold">
                                {language === 'fr' ? '✓ SEANCE EFFECTUEE' : '✓ WORKOUT COMPLETED'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-2 font-bold">{session.durationMinutes} MIN</td>
                          <td className="py-2 pr-2">{session.distanceKm ? `${session.distanceKm} KM` : 'N/A'}</td>
                          <td className="py-2 pr-2 font-bold">{session.intensityPercent}% FCM</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* PRINT FOOTER */}
            <div className="mt-8 pt-4 border-t-2 border-black flex justify-between items-center text-[8px] font-mono text-gray-500">
              <span>APP: STRIDE_AI CLINICAL ENGINE • ATHLETE NAME: {athleteEmail || 'learninhack@gmail.com'}</span>
              <span>STRIDE_AI SYSTEM • CONFIDENTIAL & SECURITY COMPLIANT PRECRIPTION SUMMARY</span>
            </div>
          </div>
        );
      })()}

      {/* PRINT FALLBACK HELPER MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-none p-6 space-y-5 relative shadow-[0_0_50px_rgba(204,255,0,0.15)] my-8">
            <button
              onClick={() => {
                setShowPrintModal(false);
                setCopiedStatus(false);
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-1">
              <span className="text-[10px] bg-[#CCFF00] text-black px-2.5 py-0.5 rounded-none font-mono font-black tracking-widest uppercase inline-block">
                {language === 'fr' ? 'SÉCURITÉ DE L\'IFRAME DU NAVIGATEUR' : 'BROWSER SANDBOX SECURITY'}
              </span>
              <h3 className="font-display font-black text-2xl text-white uppercase tracking-tighter italic">
                {language === 'fr' ? 'SÉCURITÉ DU NAVIGATEUR ET EXPORT PDF' : 'PRINT BLOCKED BY BROWSER SANDBOX'}
              </h3>
            </div>

            <div className="text-xs uppercase font-mono leading-relaxed space-y-3 p-4 bg-white/[0.03] border border-white/10 text-white/80">
              <p className="font-extrabold text-[#CCFF00]">
                {language === 'fr' ? 'POURQUOI CETTE ALERTE ?' : 'WHY IS THIS HAPPENING?'}
              </p>
              <p>
                {language === 'fr'
                  ? "Votre navigateur bloque l'appel direct d'impression car l'application est en prévisualisation dans l'iframe sécurisé (AI Studio sandbox). Aucun module tiers ne peut forcer l'affichage de l'impression système dans ce contexte."
                  : "Your browser is blocking the native print dialog because this preview panel runs inside a sandboxed iframe. For direct native print and PDF download, you can follow the instructions below."}
              </p>

              <p className="font-extrabold text-[#CCFF00] pt-2">
                {language === 'fr' ? 'COMMENT PROCÉDER (DEUX SOLUTIONS RAPIDES) :' : 'HOW TO PROCEED (TWO EASY OPTIONS) :'}
              </p>
              <ol className="list-decimal list-inside space-y-2 text-white pl-1.5 regular-case font-mono normal-case">
                <li className="normal-case">
                  <strong className="uppercase">{language === 'fr' ? 'Ouvrir dans un nouvel onglet (Recommandé) :' : 'Open in New Tab (Recommended) :'}</strong>{' '}
                  {language === 'fr'
                    ? "Cliquez sur le bouton de flèche oblique 'Open in New Tab' en haut à droite de l'aperçu de l'application. Dans ce nouvel onglet, le bouton d'impression fonctionnera instantanément !"
                    : "Tap the small diagonal arrow icon / 'Open in New tab' on the top right corner of the live preview panel. Inside any standard tab, printing executes gracefully, instantly opening the OS PDF dialogue."}
                </li>
                <li className="normal-case">
                  <strong className="uppercase">{language === 'fr' ? 'Copier le résumé brut textuel :' : 'Copy raw text outline :'}</strong>{' '}
                  {language === 'fr'
                    ? "Copiez le programme au format texte structuré pour le coller directement dans vos notes ou applications personnalisées."
                    : "Copy the full 4-week structured schedule outline instantly to keep as a text log in your workout logs."}
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getFullMarkdown());
                  setCopiedStatus(true);
                  setTimeout(() => setCopiedStatus(false), 2500);
                }}
                className="bg-white/5 hover:bg-[#CCFF00] hover:text-black hover:border-[#CCFF00] border border-white/10 text-white font-mono font-black uppercase text-[10px] tracking-wider transition-all px-4 py-3 flex items-center justify-center gap-2 flex-1 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>
                  {copiedStatus 
                    ? (language === 'fr' ? 'COPIÉ COMPLÈTEMENT !' : 'COPIED TO CLIPBOARD!') 
                    : (language === 'fr' ? 'COPIER LE PROGRAMME EN TEXTE' : 'COPY ALL PRESCRIPTION TEXT')}
                </span>
              </button>

              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch(e) {
                    console.warn(e);
                  }
                }}
                className="bg-[#CCFF00] text-black hover:bg-white hover:text-black font-mono font-black uppercase text-[10px] tracking-wider transition-all px-4 py-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'fr' ? 'TENTER L\'IMPRESSION DIRECTE' : 'FORCE PRINT DIRECTLY'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMMERSIVE WORKOUT SUMMARY MODAL */}
      {isWorkoutModalOpen && selectedSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#0B0B0B] border border-white/10 w-full max-w-2xl rounded-none p-0 relative shadow-[0_0_50px_rgba(204,255,0,0.2)] my-8">
            <button
              onClick={() => setIsWorkoutModalOpen(false)}
              className="absolute top-4 right-4 z-[110] text-white/50 bg-black/80 border border-white/10 hover:text-white hover:border-[#CCFF00] hover:shadow-[0_0_10px_rgba(204,255,0,0.2)] transition-all p-1.5 rounded-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Simulated Live Route Map Image Header */}
            <div className="relative h-64 w-full overflow-hidden bg-zinc-900 border-b border-white/10 flex items-center justify-center select-none">
              <img
                src={getRouteMapImage(selectedSession.type)}
                alt={`${selectedSession.title} simulated path telemetry`}
                className="w-full h-full object-cover object-center filter saturate-125 brightness-90 animate-pulse-slow"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] bg-[#CCFF00] text-black font-extrabold px-2 py-0.5 rounded-none uppercase font-mono tracking-widest leading-none">
                    {getDayTranslation(selectedSession.day)}
                  </span>
                  <span className={getSessionBadgeColor(selectedSession.type)}>
                    {getSessionTypeLabel(selectedSession.type)}
                  </span>
                </div>
                <h3 className="font-display font-black text-2xl md:text-3xl text-white uppercase tracking-tighter italic leading-tight">
                  {selectedSession.title}
                </h3>
              </div>

              {/* GPS HUD Tag */}
              <div className="absolute top-4 left-4 bg-black/75 border border-[#CCFF00]/40 px-2 py-1 text-[8px] font-mono text-[#CCFF00] font-black tracking-widest uppercase">
                📡 {selectedSession.type === 'repos' ? 'PHYSIO OFFLINE LOOPS' : 'STRIDE_AI GPS ROUTE TELEMETRY'}
              </div>
            </div>

            {/* Modal Inner Details */}
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 font-mono">
                  {language === 'fr' ? 'PRESCRIPTION ATHLÉTIQUE ET PARCOURS CIBLE' : 'ATHLETIC PRESCRIPTION & TARGET PATH'}
                </h4>
                <p className="text-xs text-white bg-white/[0.02] p-4 border border-white/5 leading-relaxed font-mono uppercase">
                  {selectedSession.description}
                </p>
              </div>

              {/* Dashboard Grid metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/60 p-3 border border-white/10 rounded-none font-mono">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-white/40 block">
                    {language === 'fr' ? 'TEMPS CIBLE' : 'TARGET TIME'}
                  </span>
                  <span className="text-sm font-black text-white mt-1.5 leading-none block">
                    ⏱️ {selectedSession.durationMinutes} MIN
                  </span>
                </div>

                <div className="bg-black/60 p-3 border border-white/10 rounded-none font-mono">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-white/40 block">
                    {language === 'fr' ? 'INTENSITÉ CIBLE' : 'TARGET INTENSITY'}
                  </span>
                  <span className="text-sm font-black text-[#CCFF00] mt-1.5 leading-none block">
                    ❤️ {selectedSession.intensityPercent}% FCM
                  </span>
                </div>

                <div className="bg-black/60 p-3 border border-white/10 rounded-none font-mono">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-white/40 block">
                    {language === 'fr' ? 'DISTANCE EST.' : 'EST. DISTANCE'}
                  </span>
                  <span className="text-sm font-black text-sky-400 mt-1.5 leading-none block">
                    📍 {selectedSession.distanceKm ? `${selectedSession.distanceKm} KM` : 'N/A'}
                  </span>
                </div>

                <div className="bg-black/60 p-3 border border-white/10 rounded-none font-mono">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-white/40 block font-bold">
                    {language === 'fr' ? 'ZONE CARDIAQUE' : 'PHYSIO ZONE'}
                  </span>
                  <span className="text-sm font-black text-amber-500 mt-1.5 leading-none block">
                    🔥 {selectedSession.intensityPercent >= 85 ? 'Z4/Z5 VO2' : selectedSession.intensityPercent >= 75 ? 'Z3 TEMPO' : selectedSession.type === 'repos' ? 'Z0 RECOVERY' : 'Z2 AEROBIC'}
                  </span>
                </div>
              </div>

              {/* Warmup & Cooldown elements */}
              {selectedSession.type !== 'repos' && (selectedSession.warmup || selectedSession.cooldown) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 font-mono">
                  {selectedSession.warmup && (
                    <div className="border-l-2 border-[#CCFF00] bg-white/[0.01] p-3 pl-3.5">
                      <h5 className="text-[8px] font-black uppercase tracking-widest text-[#CCFF00]">
                        {language === 'fr' ? 'ÉCHAUFFEMENT CONSEILLÉ :' : 'PRE-RUN WARMUP ROUTINE :'}
                      </h5>
                      <p className="text-[10px] uppercase text-white/70 mt-1 leading-relaxed">{selectedSession.warmup}</p>
                    </div>
                  )}

                  {selectedSession.cooldown && (
                    <div className="border-l-2 border-white/20 bg-white/[0.01] p-3 pl-3.5">
                      <h5 className="text-[8px] font-black uppercase tracking-widest text-white/40">
                        {language === 'fr' ? 'RÉCUPÉRATION RECOMMANDÉE :' : 'POST-RUN COOLDOWN ROUTINE :'}
                      </h5>
                      <p className="text-[10px] uppercase text-white/70 mt-1 leading-relaxed">{selectedSession.cooldown}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Session completion actions */}
              <div className="bg-black/50 p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-white uppercase">
                    {language === 'fr' ? 'ÉTAT CIVIL DU COUREUR' : 'ATHLETIC HEART CHECK'}
                  </h5>
                  <p className="text-[10px] text-white/50 uppercase">
                    {language === 'fr' 
                      ? 'Archiver cette session directement pour synchroniser l\'ajustement cardiaque.' 
                      : 'Set completed track status to update the adaptive training log telemetry.'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onToggleSession(selectedSession.id);
                  }}
                  className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                    completedSessions[selectedSession.id]
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-[#CCFF00] text-black border-[#CCFF00] hover:bg-white hover:text-black hover:border-white font-extrabold'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {completedSessions[selectedSession.id]
                      ? (language === 'fr' ? 'SÉANCE COMPLÉTÉE ✓' : 'SESSION COMPLETED ✓')
                      : (language === 'fr' ? 'MARQUER EFFECTUÉE' : 'MARK COMPLETED')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
