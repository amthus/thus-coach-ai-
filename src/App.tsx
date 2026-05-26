/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  TrainingPlan, 
  CoachPersona, 
  ChatMessage 
} from './types';
import RunningPaceCalc from './components/RunningPaceCalc';
import TrainingPlanDisplay from './components/TrainingPlanDisplay';
import CoachChat from './components/CoachChat';
import PhysiologyDashboard from './components/PhysiologyDashboard';
import IntelligentSidebar from './components/IntelligentSidebar';
import { i18n, Language } from './i18n';
import { 
  Activity, 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  Activity as HeartIcon, 
  Loader2, 
  ShieldAlert,
  ArrowRight,
  LogOut,
  Sliders,
  Shield,
  Search,
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Bell,
  Info,
  Flame,
  Clock,
  Settings,
  Check,
  Printer
} from 'lucide-react';

const coaches: CoachPersona[] = [
  {
    id: 'michel',
    name: 'Coach Michel',
    avatar: 'M',
    description: 'Style dynamique axe sur l energie',
    style: 'Dynamique',
    systemPrompt: "Tu es un coach hyper dynamique, enthousiaste de course à pied, qui utilise beaucoup d'expressions motivantes d'entraîneur d'athlétisme. Tu donnes des conseils précis pour garder le moral et s'amuser. Ne mets aucun emoji dans tes réponses."
  },
  {
    id: 'helene',
    name: 'Coach Helene',
    avatar: 'H',
    description: "Approche scientifique et physiologique de l effort",
    style: 'Methodique',
    systemPrompt: "Tu es une coach de renommée très axée sur la physiologie de l'effort physique. Tu parles de seuil anaérobie, de FCM (Fréquence Cardiaque Maximale), d'allures précises, et d'importance de l'endurance fondamentale de façon claire, nette et concise. Ne mets aucun emoji dans tes réponses."
  },
  {
    id: 'chloe',
    name: 'Coach Chloe',
    avatar: 'C',
    description: "Focus sur la recuperation active et le bien etre",
    style: 'Prevention',
    systemPrompt: "Tu es une coach axée sur la prévention des blessures. Tu insistes sur le bien-être, l'absence absolue de douleurs articulaires, la respiration abdominale, la souplesse, et l'ajustement du volume d'entraînement. Ne mets aucun emoji dans tes réponses."
  }
];

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [language, setLanguage] = useState<Language>('fr');

  const [profile, setProfile] = useState<UserProfile>({
    age: 28,
    level: 'debutant',
    frequency: 3,
    avgDistance: 4,
    objective: '10k',
    customObjective: '',
    injuryHistory: ''
  });

  const [activeCoach, setActiveCoach] = useState<CoachPersona>(coaches[0]);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'plan' | 'chat' | 'physiology'>('plan');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // fatigue collection and AI recommendation states
  const [activeFatigueSessionId, setActiveFatigueSessionId] = useState<string | null>(null);
  const [isSubmittingFatigue, setIsSubmittingFatigue] = useState(false);
  const [tempFatigueScore, setTempFatigueScore] = useState<number>(5);
  
  const [sessionFatigue, setSessionFatigue] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('stride_session_fatigue');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [fatigueRecommendations, setFatigueRecommendations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('stride_fatigue_recommendations');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // custom UX states
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'info' | 'warn' }[]>([]);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'granite'>('gemini');

  // workout notification reminders system states
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() => {
    return localStorage.getItem('stride_reminders_enabled') !== 'false';
  });
  const [reminderTime, setReminderTime] = useState<string>(() => {
    return localStorage.getItem('stride_reminder_time') || '08:00';
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [simulatedNotifications, setSimulatedNotifications] = useState<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'info' | 'reminder' | 'warning' | 'success';
    read: boolean;
  }[]>([]);
  const [notifications, setNotifications] = useState<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'info' | 'reminder' | 'warning' | 'success';
    read: boolean;
  }[]>([]);

  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  const [lastNotifiedTime, setLastNotifiedTime] = useState<string>('');

  const sendWebNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.error('Failed to dispatch Web Notification:', e);
      }
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(err => {
          console.warn('Notification permission request rejected:', err);
        });
      }
    }
  }, [remindersEnabled]);

  useEffect(() => {
    if (!remindersEnabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentH = now.getHours().toString().padStart(2, '0');
      const currentM = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${currentH}:${currentM}`;

      if (timeStr === reminderTime && lastNotifiedTime !== timeStr) {
        setLastNotifiedTime(timeStr);
        const title = language === 'fr' ? "Rappel d'entraînement Stride_AI" : "Stride_AI Workout Reminder";
        const bodyEn = "It is time for your scheduled athletic run! Gear up and start your sequence.";
        const bodyFr = "C'est l'heure de votre séance programmée ! Équipez-vous et débutez votre entraînement.";
        const body = language === 'fr' ? bodyFr : bodyEn;

        addToast(`⏰ ${body}`, 'info');
        sendWebNotification(title, body);

        const newNotif = {
          id: `scheduled-${Date.now()}`,
          title: language === 'fr' ? "Rappel d'entraînement" : "Workout Reminder",
          description: body,
          timestamp: timeStr,
          type: 'reminder' as const,
          read: false
        };

        setSimulatedNotifications(prev => [newNotif, ...prev]);
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [remindersEnabled, reminderTime, lastNotifiedTime, language]);

  const addToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const triggerWorkoutReminderToast = () => {
    const randomTipsEn = [
      "Workout reminder: Time to gear up! Footing session starting soon.",
      "Stride_IA Alarm: Put on your shoes and begin your scheduled interval runs!",
      "Athlete reminder: Recovery routine scheduled at 20:00 to avoid injury.",
      "Cardio alert: Keep your threshold pace consistent to maximize performance."
    ];
    const randomTipsFr = [
      "Rappel d'entraînement : C'est l'heure d'attacher vos lacets pour la séance !",
      "Alarme Stride_IA : Débutez votre fractionné programmé pour garder la forme !",
      "Rappel d'athlète : Phase de récupération prévue ce soir à 20h00 pour éviter les blessures.",
      "Alerte cardio : Maintenez votre allure cible de façon stable aujourd'hui !"
    ];

    const tips = language === 'fr' ? randomTipsFr : randomTipsEn;
    const selectedText = tips[Math.floor(Math.random() * tips.length)];

    addToast(`⏰ ${selectedText}`, 'info');
    sendWebNotification(
      language === 'fr' ? "Rappel Stride_AI" : "Stride_AI Alert",
      selectedText
    );

    const newNotif = {
      id: `sim-${Date.now()}`,
      title: language === 'fr' ? "Rappel d'entraînement immédiat" : "Instant Workout Reminder",
      description: selectedText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: 'reminder' as const,
      read: false
    };

    setSimulatedNotifications(prev => [newNotif, ...prev]);
  };

  useEffect(() => {
    const list: typeof notifications = [];
    const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (!plan) {
      list.push({
        id: 'no-plan',
        title: language === 'fr' ? 'Configuration requise' : 'Plan creation required',
        description: language === 'fr' 
          ? 'Enregistrez votre profil pour calculer un plan 4 semaines.' 
          : 'Configure your athlete profile to synthesize a 4-week running plan.',
        timestamp: '18:00',
        type: 'warning',
        read: false
      });
    } else {
      const next = (() => {
        for (const week of plan.weeks) {
          for (const s of week.sessions) {
            if (!completedSessions[s.id]) return s;
          }
        }
        return null;
      })();

      if (next) {
        list.push({
          id: 'next-workout',
          title: language === 'fr' ? 'Prochaine séance planifiée' : 'Upcoming target run',
          description: language === 'fr'
            ? `Rappel : Votre prochaine séance est le ${next.day} (${next.title}, ${next.durationMinutes} min).`
            : `Reminder: Your next workout is on ${next.day} (${next.title}, ${next.durationMinutes} min).`,
          timestamp: reminderTime,
          type: 'reminder',
          read: false
        });

        const completedWithoutFatigue = plan.weeks
          .flatMap(w => w.sessions)
          .filter(s => completedSessions[s.id] && sessionFatigue[s.id] === undefined);

        if (completedWithoutFatigue.length > 0) {
          const firstPending = completedWithoutFatigue[0];
          list.push({
            id: 'pending-fatigue',
            title: language === 'fr' ? 'Calibrage de charge requis' : 'Load calibration needed',
            description: language === 'fr'
              ? `Soumettez votre fatigue pour la séance "${firstPending.title}" afin de mettre à jour le volume.`
              : `Submit post-run fatigue for "${firstPending.title}" to calibrate active technical loads.`,
            timestamp: nowStr,
            type: 'warning',
            read: false
          });
        }
      } else {
        list.push({
          id: 'all-complete',
          title: language === 'fr' ? 'Protocole complété !' : 'All workouts complete!',
          description: language === 'fr'
            ? 'Félicitations, vous avez complété l\'intégralité de vos séances !'
            : 'Fabulous job! You have logged all of your scheduled training sessions.',
          timestamp: '10:00',
          type: 'success',
          read: false
        });
      }
    }

    list.push({
      id: 'hydration-tip',
      title: language === 'fr' ? 'Rappel hydratation active' : 'Hydration reminder',
      description: language === 'fr'
        ? 'Buvez 500ml d\'eau 2h avant le début de votre séance d\'endurance.'
        : 'Drink 500ml of water 2h prior to starting any long-duration endurance runs.',
      timestamp: '07:30',
      type: 'info',
      read: true
    });

    const merged = [...simulatedNotifications, ...list].filter(n => !dismissedNotificationIds.includes(n.id));
    setNotifications(merged);
  }, [plan, completedSessions, sessionFatigue, language, reminderTime, simulatedNotifications, dismissedNotificationIds]);

  const handleProviderChange = (provider: 'gemini' | 'granite') => {
    setAiProvider(provider);
    localStorage.setItem('stride_ai_provider', provider);
    addToast(
      language === 'fr' 
        ? `Moteur d'IA : ${provider === 'gemini' ? 'Google Gemini' : 'IBM Granite (Watsonx)'}`
        : `AI Engine: ${provider === 'gemini' ? 'Google Gemini' : 'IBM Granite (Watsonx)'}`,
      'info'
    );
  };

  const t = i18n[language];

  useEffect(() => {
    const savedLanguage = localStorage.getItem('stride_language') as Language;
    if (savedLanguage) setLanguage(savedLanguage);

    const savedView = localStorage.getItem('stride_view') as 'landing' | 'app';
    if (savedView) setView(savedView);

    const savedPlan = localStorage.getItem('coach_running_plan');
    const savedCompleted = localStorage.getItem('coach_completed_sessions');
    const savedProfile = localStorage.getItem('coach_athlete_profile');
    const savedCoachId = localStorage.getItem('coach_active_id');
    const savedProvider = localStorage.getItem('stride_ai_provider') as 'gemini' | 'granite';

    if (savedPlan) {
      try { setPlan(JSON.parse(savedPlan)); } catch(e) {}
    }
    if (savedCompleted) {
      try { setCompletedSessions(JSON.parse(savedCompleted)); } catch(e) {}
    }
    if (savedProfile) {
      try { setProfile(JSON.parse(savedProfile)); } catch(e) {}
    }
    if (savedCoachId) {
      const selected = coaches.find(c => c.id === savedCoachId);
      if (selected) setActiveCoach(selected);
    }
    if (savedProvider) {
      setAiProvider(savedProvider);
    }
  }, []);

  useEffect(() => {
    if (view === 'app') {
      const hasCompletedTour = localStorage.getItem('stride_onboarding_completed_1');
      if (!hasCompletedTour) {
        setTourStep(0);
      }
    }
  }, [view]);

  useEffect(() => {
    if (plan) {
      const welcomeText = language === 'fr' 
        ? `Bonjour. Je suis ravi de t'accompagner. J'ai formule ton protocole "${plan.objectiveLabel}" adapte a ton niveau "${plan.levelLabel}".\n\nN'hesite pas a me questionner sur tes allures de course, tes chaussures ou sur le travail de tes zones cardiaques actives. Comment s'est déroulee ta derniere sortie ?`
        : `Hello. I am pleased to support your journey. I have formulated your protocol "${plan.objectiveLabel}" adapted to your initial level "${plan.levelLabel}".\n\nFeel free to ask me questions regarding your running paces, gear, or active heart rate zones. How was your last workout run?`;

      setChatMessages([
        {
          id: 'welcome',
          sender: 'coach',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      const startText = language === 'fr'
        ? `Bonjour. Remplis d'abord le profil d'athlete sur la gauche pour m'indiquer tes contraintes physiologiques, puis clique sur Calculer mon protocole pour lancer la planification.`
        : `Hello. Please fill in your athlete profile on the left column to share your physiological stats, then click Calculate workouts to begin.`;

      setChatMessages([
        {
          id: 'welcome-no-plan',
          sender: 'coach',
          text: startText,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [plan, activeCoach, language]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('stride_language', lang);
  };

  const handleViewChange = (v: 'landing' | 'app') => {
    setView(v);
    localStorage.setItem('stride_view', v);
  };

  const handleProfileChange = (key: keyof UserProfile, value: any) => {
    const updated = { ...profile, [key]: value };
    if (key === 'frequency') {
      const parsed = parseInt(value) || 3;
      updated.frequency = Math.min(Math.max(parsed, 1), 6);
    }
    setProfile(updated);
    localStorage.setItem('coach_athlete_profile', JSON.stringify(updated));
  };

  const handleCoachChange = (coach: CoachPersona) => {
    setActiveCoach(coach);
    localStorage.setItem('coach_active_id', coach.id);
  };

  const generateTrainingPlan = async () => {
    setIsGeneratingPlan(true);
    setErrorStatus(null);
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, coachPersona: activeCoach, aiProvider })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Execution response error.");
      }

      const generatedPlan: TrainingPlan = await response.json();
      setPlan(generatedPlan);
      setCompletedSessions({});
      
      localStorage.setItem('coach_running_plan', JSON.stringify(generatedPlan));
      localStorage.setItem('coach_completed_sessions', JSON.stringify({}));
      
      setActiveTab('plan');
      addToast(
        language === 'fr' 
          ? `✓ Plan d'entraînement généré avec succès par ${aiProvider === 'gemini' ? 'Gemini' : 'Granite'} !`
          : `✓ Workout protocol synthesized by ${aiProvider === 'gemini' ? 'Gemini' : 'Granite'} !`,
        'success'
      );
      sendWebNotification(
        language === 'fr' ? "Nouveau Plan d'Entraînement Disponible" : "New Training Protocol Compiled",
        language === 'fr' 
          ? `Votre programme d'entraînement de 4 semaines sur le thème '${generatedPlan.objectiveLabel}' est prêt.`
          : `Your 4-week custom workout schedule on '${generatedPlan.objectiveLabel}' is compiled and online.`
      );
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Network exception.");
      addToast(
        language === 'fr' ? 'Échec de formulation du protocole.' : 'Protocol formulation failed.',
        'warn'
      );
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const toggleSessionCompletion = (sessionId: string) => {
    const isNowCompleted = !completedSessions[sessionId];
    const updated = {
      ...completedSessions,
      [sessionId]: isNowCompleted
    };
    setCompletedSessions(updated);
    localStorage.setItem('coach_completed_sessions', JSON.stringify(updated));
    
    addToast(
      isNowCompleted
        ? (language === 'fr' ? '🎉 Séance validée et archivée !' : '🎉 Workout recorded and archived!')
        : (language === 'fr' ? 'Séance restaurée pour exécution.' : 'Workout execution restored.'),
      isNowCompleted ? 'success' : 'info'
    );

    if (isNowCompleted) {
      setTempFatigueScore(5);
      setActiveFatigueSessionId(sessionId);
    } else {
      // Clean up fatigue metadata if restoring session
      const updatedFatigue = { ...sessionFatigue };
      delete updatedFatigue[sessionId];
      setSessionFatigue(updatedFatigue);
      localStorage.setItem('stride_session_fatigue', JSON.stringify(updatedFatigue));

      const updatedRecs = { ...fatigueRecommendations };
      delete updatedRecs[sessionId];
      setFatigueRecommendations(updatedRecs);
      localStorage.setItem('stride_fatigue_recommendations', JSON.stringify(updatedRecs));
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSendingMessage) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/chat-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          profile,
          coachPersona: activeCoach,
          aiProvider
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Communication failure.");
      }

      const result = await response.json();
      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: result.text || "No responsive content gathered.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, coachMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `coach-error-${Date.now()}`,
        sender: 'coach',
        text: language === 'fr' 
          ? `Impossible de joindre le service de communication. Veuillez configurer votre GEMINI_API_KEY dans le menu de gauche ou les Secrets du service.`
          : `Failed to join the communication endpoint. Please verify that GEMINI_API_KEY is configured under your active Secrets.`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const resetAllData = () => {
    const check = language === 'fr' 
      ? confirm("Reinitialiser vos variables physiologiques et vider le plan actuel ?")
      : confirm("Reset physiological parameters and empty active workout schedule?");
    if (check) {
      localStorage.removeItem('coach_running_plan');
      localStorage.removeItem('coach_completed_sessions');
      setPlan(null);
      setCompletedSessions({});
      setErrorStatus(null);
    }
  };

  // RENDER LANDING VIEW
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#CCFF00] selection:text-black antialiased relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />
        
        <header className="h-20 max-w-7xl w-full mx-auto flex items-center justify-between px-6 sm:px-10 shrink-0 border-b border-white/5 relative z-10">
          <span className="font-black text-2xl tracking-tighter uppercase font-display italic">
            Stride<span className="text-[#CCFF00]">_IA</span>
          </span>
          <div className="flex items-center gap-2 border border-white/10 p-1">
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider ${language === 'fr' ? 'bg-[#CCFF00] text-black' : 'text-white/40 hover:text-white'}`}
            >
              FR
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider ${language === 'en' ? 'bg-[#CCFF00] text-black' : 'text-white/40 hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-24 text-center flex flex-col justify-center items-center relative z-10 space-y-12">
          <div className="space-y-6">
            <span className="text-[10px] bg-[#CCFF00]/10 text-[#CCFF00] font-mono font-black py-1.5 px-4 rounded-none border border-[#CCFF00]/25 tracking-widest uppercase inline-block">
              {t.beta}
            </span>
            <h1 className="text-5xl sm:text-7xl font-sans font-black tracking-tight uppercase leading-none italic font-display">
              {t.landingTitle}
            </h1>
            <p className="text-sm max-w-xl mx-auto font-mono text-[#CCFF00] font-black uppercase tracking-widest leading-relaxed">
              {t.landingTagline}
            </p>
            <p className="text-xs sm:text-sm text-white/60 max-w-2xl mx-auto leading-relaxed uppercase font-mono">
              {t.landingDesc}
            </p>
          </div>

          <div>
            <button
              onClick={() => handleViewChange('app')}
              className="bg-[#CCFF00] text-black hover:bg-white transition-all text-xs font-black uppercase tracking-widest py-5 px-10 rounded-none shadow-[0_0_25px_rgba(204,255,0,0.3)] hover:shadow-[0_0_35px_rgba(255,255,255,0.2)] flex items-center gap-3 active:scale-[0.99] cursor-pointer"
            >
              <span>{t.landingEnter}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12 md:pt-20 border-t border-white/5 text-left">
            <div className="border border-white/10 bg-white/[0.01] p-6 relative">
              <div className="absolute top-0 left-0 w-1 h-3 bg-[#CCFF00]" />
              <div className="absolute top-0 left-0 w-3 h-1 bg-[#CCFF00]" />
              <Sliders className="w-5 h-5 text-[#CCFF00] mb-4" />
              <h3 className="text-xs font-black uppercase tracking-wider mb-2">{t.landingFeatureRealism}</h3>
              <p className="text-[10px] font-mono uppercase text-white/50 leading-relaxed">{t.landingFeatureRealismDesc}</p>
            </div>

            <div className="border border-white/10 bg-white/[0.01] p-6 relative">
              <div className="absolute top-0 left-0 w-1 h-3 bg-white/40" />
              <div className="absolute top-0 left-0 w-3 h-1 bg-white/40" />
              <Shield className="w-5 h-5 text-white/60 mb-4" />
              <h3 className="text-xs font-black uppercase tracking-wider mb-2">{t.landingFeatureSecurity}</h3>
              <p className="text-[10px] font-mono uppercase text-white/50 leading-relaxed">{t.landingFeatureSecurityDesc}</p>
            </div>

            <div className="border border-white/10 bg-white/[0.01] p-6 relative">
              <div className="absolute top-0 left-0 w-1 h-3 bg-[#CCFF00]" />
              <div className="absolute top-0 left-0 w-3 h-1 bg-[#CCFF00]" />
              <Search className="w-5 h-5 text-[#CCFF00] mb-4" />
              <h3 className="text-xs font-black uppercase tracking-wider mb-2">{t.landingFeaturePrecision}</h3>
              <p className="text-[10px] font-mono uppercase text-white/50 leading-relaxed">{t.landingFeaturePrecisionDesc}</p>
            </div>
          </div>
        </main>

        <footer className="h-16 border-t border-white/5 flex items-center justify-center text-[9px] font-mono text-white/30 uppercase tracking-widest px-6 relative z-10 w-full mt-auto">
          STRIDE_IA ENGINE PORTAL • OPERATING UNDER SECURE BACKEND CONTROLS
        </footer>
      </div>
    );
  }

  // Analytical calculation of upcoming workout reminders
  const nextUncompletedWorkout = plan ? (() => {
    for (const week of plan.weeks) {
      for (const sess of week.sessions) {
        if (!completedSessions[sess.id]) {
          return sess;
        }
      }
    }
    return null;
  })() : null;

  const allSessionsInPlan = plan ? plan.weeks.flatMap(w => w.sessions) : [];
  const totalPlanSessions = allSessionsInPlan.length;
  const completedPlanSessions = allSessionsInPlan.filter(s => completedSessions[s.id]).length;

  // RENDER APP VIEW
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#CCFF00] selection:text-black antialiased relative print:bg-white print:text-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/[0.02] via-transparent to-transparent pointer-events-none print:hidden" />
      
      {/* GUIDED ONBOARDING TOUR SPEAKER BUBBLE OVERLAY */}
      {tourStep !== null && (() => {
        const onboardingSteps = [
          {
            targetId: 'athlete-profile-section',
            titleFr: "1. Profil d'Entraînement Physiologique",
            titleEn: "1. Physiological Training Profile",
            descFr: "Saisissez votre âge, votre niveau et vos restrictions physiques. C'est ici que Stride_AI calcule les seuils cardiaques.",
            descEn: "Establish your physiological metrics here so the system calculates active threshold margins accurately."
          },
          {
            targetId: 'coach-selector-michel',
            titleFr: "2. Choix du tempérament d'IA Coach",
            titleEn: "2. Coach Trait Configuration",
            descFr: "Choisissez un tempérament : Michel le motivateur, Hélène la scientifique ou Chloé la préventive. Le ton s'adapte à vous.",
            descEn: "Configure coach personalities to adjust dialogue tones: intense motivation, scientific metrics, or prevention parameters."
          },
          {
            targetId: 'ai-provider-tour-anchor',
            titleFr: "3. Sélecteur de Moteur de Calcul d'IA",
            titleEn: "3. Choose between Google & IBM",
            descFr: "Basculez à la volée entre les serveurs Google Gemini et le modèle IBM Watsonx Granite pour la synthèse de vos plans.",
            descEn: "Toggle at any time between Google Gemini and physical IBM Watsonx Granite computation servers."
          },
          {
            targetId: 'tab-view-plan',
            titleFr: "4. Calendrier & Fiches d'Entraînement",
            titleEn: "4. Training Schedule & Interactive Logs",
            descFr: "Prenez connaissance de votre plan hebdomadaire, cochez vos sorties complétées et imprimez un rapport PDF avec advisory notes.",
            descEn: "Review your weekly targeted runs, archive finished workouts, and print clean physical PDF reports."
          },
          {
            targetId: 'tab-view-chat',
            titleFr: "5. Messagerie Instantanée",
            titleEn: "5. Active Coaching Direct Conversation",
            descFr: "Posez toutes vos questions à votre coach virtuel à n'importe quel moment de la préparation : allures, hydratation, équipement.",
            descEn: "Talk directly with your coach. Receive professional advice on metabolic zones, joint fatigue, or optimal pacing configurations."
          }
        ];

        const handleNextTour = () => {
          const nextStep = tourStep + 1;
          if (nextStep < onboardingSteps.length) {
            setTourStep(nextStep);
            if (nextStep === 3) setActiveTab('plan');
            if (nextStep === 4) setActiveTab('chat');
          } else {
            handleSkipTour();
          }
        };

        const handlePrevTour = () => {
          if (tourStep === 0) return;
          const prevStep = tourStep - 1;
          setTourStep(prevStep);
          if (prevStep < 3) setActiveTab('plan');
        };

        const handleSkipTour = () => {
          setTourStep(null);
          localStorage.setItem('stride_onboarding_completed_1', 'true');
          addToast(
            language === 'fr' 
              ? "✓ Onboarding terminé ! Découvrez l'application." 
              : "✓ Walkthrough completed! Enjoy using the console.",
            'success'
          );
        };

        return (
          <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs print:hidden animate-fade-in animate-duration-200">
            <div className="bg-[#0F0F0F] border-2 border-[#CCFF00] p-6 max-w-sm w-full pointer-events-auto shadow-[0_0_50px_rgba(204,255,0,0.25)] relative text-white uppercase font-sans">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00]" />
              <button
                onClick={handleSkipTour}
                className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-3 text-[#CCFF00]">
                <HelpCircle className="w-4.5 h-4.5 shrink-0" />
                <span className="text-[10px] font-black tracking-widest block font-mono">
                  {language === 'fr' ? 'GUIDE DE DÉMARRAGE' : 'STRIDE_AI TUTORIAL'}
                </span>
              </div>

              <h3 className="font-display font-black text-sm text-white tracking-tight italic select-none">
                {language === 'fr' ? onboardingSteps[tourStep].titleFr : onboardingSteps[tourStep].titleEn}
              </h3>
              
              <p className="text-[11px] font-mono text-white/60 leading-relaxed mt-2.5 mb-5 normal-case">
                {language === 'fr' ? onboardingSteps[tourStep].descFr : onboardingSteps[tourStep].descEn}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[9px] font-mono tracking-wider">
                <button
                  onClick={handleSkipTour}
                  className="text-white/30 hover:text-white transition-all uppercase font-black cursor-pointer"
                >
                  {language === 'fr' ? 'PASSER' : 'SKIP'}
                </button>
                
                <div className="flex items-center gap-1.5">
                  {tourStep > 0 && (
                    <button
                      onClick={handlePrevTour}
                      className="border border-white/10 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white transition-all rounded-none uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleNextTour}
                    className="bg-[#CCFF00] text-black font-black px-3.5 py-1.5 transition-all rounded-none flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(204,255,0,0.2)] hover:bg-white"
                  >
                    <span>{tourStep === onboardingSteps.length - 1 ? (language === 'fr' ? 'OK' : 'FINISH') : (language === 'fr' ? 'NEXT' : 'NEXT')}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-black" />
                  </button>
                </div>
              </div>
              
              <div className="mt-3 text-center text-[8px] text-white/30 tracking-widest font-mono">
                ETAPE {tourStep + 1} / {onboardingSteps.length}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TOAST SYSTEM RENDERER */}
      <div className="fixed bottom-6 right-6 left-6 md:left-auto md:right-6 z-50 space-y-2 pointer-events-none max-w-sm w-auto print:hidden">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 border flex items-start gap-3 shadow-2xl transition-all duration-300 ${
              toast.type === 'warn'
                ? 'bg-[#1c0f10] border-rose-500/40 text-rose-400'
                : toast.type === 'info'
                  ? 'bg-[#0f1821] border-sky-500/40 text-sky-400'
                  : 'bg-[#101c10] border-[#CCFF00]/40 text-[#CCFF00]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'warn' ? (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-sky-400" />
              ) : (
                <Activity className="w-4 h-4 text-[#CCFF00]" />
              )}
            </div>
            <div className="flex-1 text-[10px] uppercase font-mono tracking-wide leading-relaxed font-black">
              {toast.text}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-white/20 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 sm:px-10 shrink-0 bg-[#0F0F0F] sticky top-0 z-30 print:hidden">
        <div 
          onClick={() => handleViewChange('landing')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-6 h-6 bg-[#CCFF00] rounded-none rotate-45 shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
          <span className="font-black text-2xl tracking-tighter uppercase font-display italic flex items-center gap-1.5 text-white">
            Stride<span className="text-[#CCFF00]">_IA</span>
          </span>
        </div>

        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-widest">
          <button 
            onClick={() => setActiveTab('plan')} 
            className={`transition-all hover:text-[#CCFF00] uppercase font-bold tracking-widest ${activeTab === 'plan' ? 'text-[#CCFF00]' : 'text-white/40'}`}
          >
            {t.tabCalendar}
          </button>
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`transition-all hover:text-[#CCFF00] uppercase font-bold tracking-widest ${activeTab === 'chat' ? 'text-[#CCFF00]' : 'text-white/40'}`}
          >
            {t.tabChat}
          </button>
          <button 
            onClick={() => setActiveTab('physiology')} 
            className={`transition-all hover:text-[#CCFF00] uppercase font-bold tracking-widest ${activeTab === 'physiology' ? 'text-[#CCFF00]' : 'text-white/40'}`}
          >
            {t.tabPhysiology}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Workout Notification Reminders System Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              id="btn-bell-notifications"
              className={`w-9 h-9 border flex items-center justify-center transition-all cursor-pointer rounded-none relative ${
                isNotificationOpen 
                  ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
                  : 'bg-black/40 border-white/10 text-white/70 hover:text-white hover:border-white/30'
              }`}
              title={language === 'fr' ? 'Centre de notifications' : 'Reminders & Notifications'}
            >
              <Bell className={`w-4 h-4 ${notifications.some(n => !n.read) ? 'animate-pulse text-[#CCFF00]' : ''}`} />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 bg-red-600 border border-black text-white font-mono text-[8px] font-bold w-4 h-4 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Custom Interactive Floating Dropdown for Notifications & Reminders */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-[#0F0F0F] border-2 border-[#CCFF00] shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-50 p-4 font-mono text-[10px] uppercase text-white animate-fade-in pointer-events-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <span className="font-white text-[10px] font-black text-[#CCFF00] tracking-wide flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    {language === 'fr' ? 'NOTIFICATIONS & RAPPELS' : 'NOTIFICATIONS LOG'}
                  </span>
                  <button 
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      setSimulatedNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    }}
                    className="text-[8px] text-white/40 hover:text-white transition-colors cursor-pointer font-bold"
                  >
                    {language === 'fr' ? '[Tout lire]' : '[Read all]'}
                  </button>
                </div>

                {/* Reminders System Config Controls */}
                <div className="bg-black/60 p-2.5 border border-white/5 space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-[9px] font-bold">
                      {language === 'fr' ? "RAPPELS ACTIFS" : "DAILY NOTIFICATIONS"}
                    </span>
                    <input 
                      type="checkbox"
                      checked={remindersEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setRemindersEnabled(val);
                        localStorage.setItem('stride_reminders_enabled', String(val));
                        addToast(
                          language === 'fr'
                            ? `✓ Notifications de rappel ${val ? 'activées' : 'désactivées'}`
                            : `✓ Notification reminders ${val ? 'enabled' : 'disabled'}`,
                          val ? 'success' : 'info'
                        );
                      }}
                      className="accent-[#CCFF00] h-3.5 w-3.5 cursor-pointer"
                    />
                  </div>
                  
                  {remindersEnabled && (
                    <div className="space-y-1 pt-1 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-[8px] font-bold">{language === 'fr' ? "HEURE PLANIFIÉE :" : "SCHEDULE TIME:"}</span>
                        <input 
                          type="time"
                          value={reminderTime}
                          onChange={(e) => {
                            const timeVal = e.target.value;
                            setReminderTime(timeVal);
                            localStorage.setItem('stride_reminder_time', timeVal);
                            addToast(
                              language === 'fr'
                                ? `✓ Heure de rappel configurée à ${timeVal} !`
                                : `✓ Reminder schedule configured for ${timeVal}!`,
                              'success'
                            );
                          }}
                          className="bg-[#1A1A1A] text-white text-[9px] font-bold border border-white/10 px-1 py-0.5 focus:outline-none focus:border-[#CCFF00] rounded-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications list queue */}
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-white/40 text-[9px] font-bold">
                      {language === 'fr' ? "Aucune notification" : "No passive notifications"}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                          setSimulatedNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                        }}
                        className={`p-2 pr-6 border transition-colors cursor-pointer text-[9px] relative group ${
                          n.read 
                            ? 'bg-black/20 border-white/5 text-white/40' 
                            : 'bg-white/[0.03] border-white/10 text-white hover:border-[#CCFF00]/40'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDismissedNotificationIds(prev => [...prev, n.id]);
                            addToast(language === 'fr' ? 'Notification vidée.' : 'Notification cleared.', 'info');
                          }}
                          className="absolute right-1.5 top-1.5 text-white/20 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                          title={language === 'fr' ? 'Supprimer' : 'Clear'}
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {!n.read && (
                          <span className="absolute top-1.5 right-6 w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
                        )}
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-black uppercase text-[8px] tracking-wider ${
                            n.type === 'warning' ? 'text-rose-400' :
                            n.type === 'success' ? 'text-emerald-400' :
                            n.type === 'reminder' ? 'text-[#CCFF00]' : 'text-sky-400'
                          }`}>
                            {n.title}
                          </span>
                          <span className="text-[7px] text-white/30 font-bold">{n.timestamp}</span>
                        </div>
                        <p className="leading-normal font-medium whitespace-pre-wrap">{n.description}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Trigger test alert CTA */}
                <div className="border-t border-white/10 pt-3 mt-3 flex gap-2">
                  <button 
                    onClick={() => {
                      setSimulatedNotifications([]);
                      setDismissedNotificationIds(prev => [...prev, ...notifications.map(n => n.id)]);
                      addToast(language === 'fr' ? 'Notifications vidées.' : 'Notifications cleared.', 'info');
                    }}
                    className="flex-1 border border-white/10 py-1.5 text-center text-[8px] font-bold tracking-widest text-white/50 hover:text-white transition-all cursor-pointer bg-white/5"
                  >
                    {language === 'fr' ? 'TOUT VIDER' : 'CLEAR ALL'}
                  </button>
                  <button 
                    onClick={triggerWorkoutReminderToast}
                    className="flex-1 bg-[#CCFF00] text-black py-1.5 text-center text-[8px] font-black tracking-widest hover:bg-white transition-all cursor-pointer"
                  >
                    {language === 'fr' ? 'TESTER NOTIF' : 'TEST REMINDER'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 border border-white/10 p-0.5">
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`px-2 py-0.5 text-[9px] font-black uppercase ${language === 'fr' ? 'bg-[#CCFF00] text-black' : 'text-white/40 hover:text-white'}`}
            >
              FR
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-0.5 text-[9px] font-black uppercase ${language === 'en' ? 'bg-[#CCFF00] text-black' : 'text-white/40 hover:text-white'}`}
            >
              EN
            </button>
          </div>


        </div>
      </header>

      {/* MANUAL walkthrough guide button floating on top of main app (visible on non-printed screen) */}
      <button
        onClick={() => setTourStep(0)}
        className="fixed bottom-6 left-6 z-40 bg-[#0F0F0F] hover:bg-[#CCFF00] border border-white/15 hover:border-[#CCFF00] text-white hover:text-black rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all shadow-lg print:hidden"
        title={language === 'fr' ? "Démarrer le guide d'utilisation" : "Start layout walkthrough"}
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-start print:hidden">
        <section id="athlete-profile-section" className="md:col-span-4 md:sticky md:top-24 space-y-8 md:max-h-[calc(100vh-120px)] md:overflow-y-auto pr-1 select-none scrollbar-thin">
          <div className="bg-[#0F0F0F] border border-white/10 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-16 bg-[#CCFF00]" />
            <div className="absolute top-0 right-0 w-16 h-2 bg-[#CCFF00]" />
            
            <div className="space-y-1.5 mb-8 border-b border-white/5 pb-4">
              <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">USER COMPLIANCE</p>
              <h2 className="text-4xl font-black leading-none uppercase tracking-tighter italic font-display">
                {t.profileTitle}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">{t.age}</label>
                  <input
                    type="number"
                    min="14"
                    max="90"
                    value={profile.age}
                    onChange={(e) => handleProfileChange('age', parseInt(e.target.value) || 30)}
                    className="w-full bg-[#1A1A1A] text-white border border-white/10 px-3 py-2.5 text-sm font-bold font-mono focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">{t.frequency}</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={profile.frequency}
                    onChange={(e) => handleProfileChange('frequency', parseInt(e.target.value) || 3)}
                    className="w-full bg-[#1A1A1A] text-white border border-white/10 px-3 py-2.5 text-sm font-bold font-mono focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">{t.level}</label>
                <div className="grid grid-cols-3 gap-1 bg-black/60 p-1 border border-white/10">
                  {(['debutant', 'intermediaire', 'avance'] as const).map((lvl) => {
                    const isActive = profile.level === lvl;
                    return (
                      <button
                        key={lvl}
                        id={`level-btn-${lvl}`}
                        onClick={() => handleProfileChange('level', lvl)}
                        className={`py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.35)]'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {lvl === 'debutant' ? t.levelNovice : lvl === 'intermediaire' ? t.levelAmateur : t.levelElite}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">{t.footingDistance}</label>
                <div className="space-y-2 bg-[#1A1A1A] border border-white/10 p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-white/40">DISTANCE / VOLUME</span>
                    <span className="text-sm font-black font-mono text-[#CCFF00]">
                      {profile.avgDistance} KM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={profile.avgDistance}
                    onChange={(e) => handleProfileChange('avgDistance', parseInt(e.target.value) || 5)}
                    className="w-full h-1 accent-[#CCFF00] bg-white/10 appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/30 font-bold">
                    <span>1 KM</span>
                    <span>12 KM</span>
                    <span>25 KM</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">{t.objectiveLabel}</label>
                <select
                  value={profile.objective}
                  onChange={(e) => handleProfileChange('objective', e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wide focus:outline-none focus:border-[#CCFF00] appearance-none rounded-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px' }}
                >
                  <option value="sante">{t.objSante}</option>
                  <option value="5k">{t.obj5k}</option>
                  <option value="10k">{t.obj10k}</option>
                  <option value="semi">{t.objSemi}</option>
                  <option value="marathon">{t.objMarathon}</option>
                  <option value="vitesse">{t.objVitesse}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">{t.physicalConstraints}</label>
                <input
                  type="text"
                  placeholder={t.physicalConstraintsPlaceholder}
                  value={profile.injuryHistory}
                  onChange={(e) => handleProfileChange('injuryHistory', e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-white/10 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#CCFF00] rounded-none placeholder-white/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">{t.customDetails}</label>
                <input
                  type="text"
                  placeholder={t.customDetailsPlaceholder}
                  value={profile.customObjective}
                  onChange={(e) => handleProfileChange('customObjective', e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-white/10 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#CCFF00] rounded-none placeholder-white/20"
                />
              </div>

              {/* SAVE PROFILE BTN FOR PHYSICAL TOAST VERIFICATION */}
              <button
                type="button"
                id="btn-save-profile"
                onClick={() => {
                  localStorage.setItem('coach_athlete_profile', JSON.stringify(profile));
                  addToast(
                    language === 'fr' 
                      ? "✓ Profil d'athlète sauvegardé avec succès !" 
                      : "✓ Athlete profile saved and synchronized!",
                    'success'
                  );
                }}
                className="w-full bg-white/5 text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black hover:border-[#CCFF00] border border-white/10 py-3 font-mono font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-none text-center"
              >
                {language === 'fr' ? '💾 ENREGISTRER MON PROFIL' : '💾 SAVE ATHLETE PROFILE'}
              </button>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <label className="block text-[10px] uppercase font-black text-white/40 tracking-widest">{t.coachChoice}</label>
                <div className="space-y-2">
                  {coaches.map((c) => {
                    const isSelected = activeCoach.id === c.id;
                    const localizedDesc = language === 'fr' 
                      ? c.description 
                      : c.id === 'michel' 
                        ? 'Dynamic energy oriented style' 
                        : c.id === 'helene' 
                          ? 'Scientific physiology of performance' 
                          : 'Safety recovery injury avoidance';

                    return (
                      <button
                        key={c.id}
                        id={`coach-selector-${c.id}`}
                        onClick={() => handleCoachChange(c)}
                        className={`w-full text-left p-3 border hover:bg-white/[0.02] flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white/5 border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.15)]'
                            : 'bg-black/40 border-white/10'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-none bg-black border border-white/10 flex items-center justify-center font-mono font-black text-xs text-[#CCFF00]">
                          {c.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-white tracking-wider">{c.name}</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-none ${
                              isSelected ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white/40'
                            }`}>
                              {c.style}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5 uppercase truncate">{localizedDesc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Engine Processor Selection Toolbar */}
              <div id="ai-provider-tour-anchor" className="border-t border-white/10 pt-4 space-y-2">
                <label className="block text-[10px] uppercase font-black text-white/40 tracking-widest font-mono">
                  {language === 'fr' ? "CONTRÔLEUR D'ENGRENAGE IA" : "AI ENGINE PROCESSOR"}
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-black/60 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleProviderChange('gemini')}
                    className={`py-2.5 px-1 text-[9px] font-mono tracking-wider transition-all rounded-none uppercase flex flex-col items-center justify-center border cursor-pointer ${
                      aiProvider === 'gemini'
                        ? 'bg-[#CCFF00] text-black border-[#CCFF00] font-black'
                        : 'bg-transparent text-white/40 border-transparent hover:text-white'
                    }`}
                  >
                    <span>GEMINI PRO</span>
                    <span className="text-[7px] opacity-70 mt-0.5 font-bold">GOOGLE CLOUD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderChange('granite')}
                    className={`py-2.5 px-1 text-[9px] font-mono tracking-wider transition-all rounded-none uppercase flex flex-col items-center justify-center border cursor-pointer ${
                      aiProvider === 'granite'
                        ? 'bg-[#CCFF00] text-black border-[#CCFF00] font-black'
                        : 'bg-transparent text-white/40 border-transparent hover:text-white'
                    }`}
                  >
                    <span>GRANITE 13B</span>
                    <span className="text-[7px] opacity-70 mt-0.5 font-bold">IBM WATSONX</span>
                  </button>
                </div>
              </div>

              {errorStatus && (
                <div className="border-l-2 border-red-500 bg-red-500/5 p-4 text-xs text-red-400 space-y-1 font-mono uppercase tracking-wide">
                  <div className="flex items-center gap-2 font-black">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                    <span>ERROR STATUS ACTIVE</span>
                  </div>
                  <p className="opacity-80 text-[10px] normal-case">{errorStatus}</p>
                </div>
              )}

              <button
                id="btn-trigger-plan"
                onClick={generateTrainingPlan}
                disabled={isGeneratingPlan}
                className="w-full bg-[#CCFF00] text-black hover:bg-white active:scale-[0.98] transition-all duration-150 py-4 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.2)] disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none cursor-pointer"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" /> {t.generatingPlanBtn.toUpperCase()}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black font-extrabold" /> {t.generatePlanBtn.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>

          <RunningPaceCalc language={language} />

          <IntelligentSidebar 
            profile={profile}
            activeCoach={activeCoach}
            language={language}
            completedCount={completedPlanSessions}
            totalCount={totalPlanSessions}
          />
        </section>

        <section className="md:col-span-8 space-y-8">
          <div className="bg-[#0F0F0F] border border-white/10 p-1 flex">
            <button
              id="tab-view-plan"
              onClick={() => setActiveTab('plan')}
              className={`flex-1 py-3 px-4 font-display font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'plan'
                  ? 'bg-white/5 border border-white/10 text-[#CCFF00] shadow-sm font-black'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t.tabCalendar}</span>
            </button>
            <button
              id="tab-view-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 px-4 font-display font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white/5 border border-white/10 text-[#CCFF00] shadow-sm font-black'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.tabChat}</span>
            </button>
            <button
              id="tab-view-physiology"
              onClick={() => setActiveTab('physiology')}
              className={`flex-1 py-3 px-4 font-display font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'physiology'
                  ? 'bg-white/5 border border-white/10 text-[#CCFF00] shadow-sm font-black'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <HeartIcon className="w-4 h-4" />
              <span>{t.tabPhysiology}</span>
            </button>
          </div>

          <div className="transition-all duration-300">
            {activeTab === 'plan' && (
              plan ? (
                <div className="space-y-6">
                  {/* Realtime upcoming workout reminder notification alert box */}
                  {nextUncompletedWorkout && (
                    <div className="bg-[#0F0F0F] border-l-4 border-[#CCFF00] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl font-sans uppercase animate-fade-in relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#CCFF00]/[0.01] rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-[#CCFF00]/10 p-2 border border-[#CCFF00]/20 text-[#CCFF00]">
                          <Bell className="w-4 h-4 animate-bounce" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono tracking-widest text-[#CCFF00] block">
                            {language === 'fr' ? 'PROCHAINE SÉANCE RECOMMANDÉE' : 'RECOMMENDED TARGET RUN'}
                          </span>
                          <span className="text-xs font-black text-white block mt-1">
                            {nextUncompletedWorkout.day} : {nextUncompletedWorkout.title} ({nextUncompletedWorkout.durationMinutes} MIN)
                          </span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-4 text-[9px] font-mono text-white/50 relative z-10 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                        <span className="bg-white/5 px-2 py-1 border border-white/10 text-white">
                          SEUIL CARDIAQUE CALIBRÉ : {nextUncompletedWorkout.intensityPercent}% FCM
                        </span>
                      </div>
                    </div>
                  )}

                  <TrainingPlanDisplay 
                    plan={plan}
                    completedSessions={completedSessions}
                    onToggleSession={toggleSessionCompletion}
                    language={language}
                    sessionFatigue={sessionFatigue}
                    fatigueRecommendations={fatigueRecommendations}
                    athleteAge={profile.age}
                    athleteEmail="learninhack@gmail.com"
                  />
                </div>
              ) : (
                <div id="no-plan-loaded-placeholder" className="bg-[#0F0F0F] border border-white/10 py-16 px-10 text-center space-y-8 relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#CCFF00]/5 blur-3xl pointer-events-none" />
                  
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Optimized by Artificial Intelligence</p>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-display">
                      WEEKLY<br/><span className="text-[#CCFF00]">PROTOCOL.</span>
                    </h2>
                  </div>

                  <div className="max-w-md mx-auto">
                    <p className="text-xs text-white/60 uppercase font-medium leading-relaxed font-mono">
                      {t.noPlanText}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left font-mono">
                    <div className="border border-white/10 bg-white/[0.01] p-5 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#CCFF00]" />
                      <span className="text-[10px] font-black tracking-widest text-[#CCFF00] uppercase block mb-1">01 / AEROBIC ADAPTATION</span>
                      <p className="text-[11px] text-white/50 leading-relaxed uppercase">
                        {language === 'fr' 
                          ? 'Developpement du systeme circulatoire profond et de la densite capillaire respiratoire.'
                          : 'Deep vascular expansion and extensive metabolic mitochondria replication.'}
                      </p>
                    </div>

                    <div className="border border-white/10 bg-white/[0.01] p-5 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-white/20" />
                      <span className="text-[10px] font-black tracking-widest text-white/40 uppercase block mb-1">02 / MODEL EXCLUSIVITY</span>
                      <p className="text-[11px] text-white/50 leading-relaxed uppercase">
                        {language === 'fr'
                          ? 'Structure analytique adaptative prevoyant les compensations de charge articulaire.'
                          : 'Adaptive calculation predicting articulate loading and avoiding structural fatigue.'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}

            {activeTab === 'chat' && (
              <CoachChat 
                profile={profile}
                activeCoach={activeCoach}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                loading={isSendingMessage}
                language={language}
              />
            )}

            {activeTab === 'physiology' && (
              <PhysiologyDashboard 
                language={language}
                athleteAge={profile.age}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="bg-[#0F0F0F] border-t border-white/10 py-8 px-10 shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 font-mono">
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-300">
            <span className="font-display font-black text-lg italic uppercase tracking-tighter text-white">STRIDE_IA</span>
            <span className="text-[9px] font-bold border border-white/20 py-0.5 px-2 text-[#CCFF00]">
              {language === 'fr' ? 'PAR THUSDEV' : 'BY THUSDEV'}
            </span>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CCFF00] text-center md:text-right">
            MALTHUS AMETEPE
          </p>
        </div>
      </footer>

      {/* FATIGUE ASSESSMENT OVERLAY MODAL */}
      {activeFatigueSessionId && (() => {
        const session = plan?.weeks.flatMap(w => w.sessions).find(s => s.id === activeFatigueSessionId);
        if (!session) return null;

        const handleFatigueSubmit = async () => {
          setIsSubmittingFatigue(true);
          try {
            // Save local score
            const updated = { ...sessionFatigue, [activeFatigueSessionId]: tempFatigueScore };
            setSessionFatigue(updated);
            localStorage.setItem('stride_session_fatigue', JSON.stringify(updated));

            // Secure server-side validation call to Gemini API for volume advice!
            const res = await fetch('/api/adjust-volume', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session,
                fatigueRating: tempFatigueScore,
                profile,
                coachPersona: activeCoach,
                aiProvider
              })
            });

            if (!res.ok) throw new Error("Erreur de calcul.");
            const data = await res.json();
            
            if (data.advice) {
              const updatedRecs = { ...fatigueRecommendations, [activeFatigueSessionId]: data.advice };
              setFatigueRecommendations(updatedRecs);
              localStorage.setItem('stride_fatigue_recommendations', JSON.stringify(updatedRecs));
              addToast(
                language === 'fr' 
                  ? '✓ Ajustement du Coach IA généré avec succès !' 
                  : '✓ Coach AI volume adjustments generated!',
                'success'
              );
              sendWebNotification(
                language === 'fr' ? "Régulation Physiologique Active" : "Active Workload Recommendation",
                language === 'fr'
                  ? `Fatigue évaluée à ${tempFatigueScore}/10. Recommandation : ${data.advice}`
                  : `Fatigue rated at ${tempFatigueScore}/10. Advice: ${data.advice}`
              );
            }
          } catch (err) {
            console.error("Fatigue response error:", err);
            addToast(
              language === 'fr' ? 'Échec d\'analyse de l\'ajustement.' : 'Could not compile adjustments.',
              'warn'
            );
          } finally {
            setIsSubmittingFatigue(false);
            setActiveFatigueSessionId(null);
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in relative print:hidden">
            <div className="bg-[#0F0F0F] border-2 border-[#CCFF00] p-6 max-w-md w-full shadow-[0_0_50px_rgba(204,255,0,0.3)] relative text-white font-sans uppercase">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00]" />
              
              <div className="flex items-center gap-2 text-orange-400 mb-4">
                <Flame className="w-5 h-5 shrink-0 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest font-mono">
                  {language === 'fr' ? 'ÉVALUATION DE FATIGUE EN DIRECT' : 'LIVE PHYSIOLOGICAL ASSESSMENT'}
                </span>
              </div>

              <h3 className="font-display font-black text-xl text-white tracking-tight italic mt-1 leading-tight">
                {language === 'fr' ? 'COMMENT VOUS SENTEZ-VOUS ?' : 'HOW WAS THIS TARGET RUN?'}
              </h3>
              
              <p className="text-[11px] font-mono text-white/50 leading-relaxed mt-1.5 mb-5 normal-case">
                {language === 'fr'
                  ? `Vous venez d'achever la séance "${session.title}". Évaluez votre niveau de fatigue physique ressentie de 1 (très en forme) à 10 (épuisement total) afin que l'intelligence artificielle ajuste scientifiquement vos prochaines séances.`
                  : `You logged "${session.title}". Please rate your muscle and cardiorespiratory fatigue from 1 (optimal freshness) to 10 (extreme failure) to allow the AI to calibrate technical loads.`}
              </p>

              {/* Visual Grid Buttons for fatigue rating selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
                  <span>{language === 'fr' ? '1 • FRAÎCHEUR OPTIMALE' : '1 • FRESH / STRONG'}</span>
                  <span>{language === 'fr' ? '10 • ÉPUISEMENT' : '10 • EXHAUSTION'}</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isSelected = tempFatigueScore === num;
                    return (
                      <button
                        key={num}
                        onClick={() => setTempFatigueScore(num)}
                        className={`py-3 font-mono font-black border text-center text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                            : 'bg-black/60 text-white/60 border-white/10 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <div className="text-center bg-[#CCFF00]/5 border border-[#CCFF00]/15 py-2">
                  <span className="text-[10px] font-mono font-black text-[#CCFF00] tracking-wider">
                    {tempFatigueScore <= 2 ? (language === 'fr' ? 'TRES FAIBLE / RÉCUPÉRATION SECURE' : 'VERY LOW FATIGUE') :
                     tempFatigueScore <= 4 ? (language === 'fr' ? 'MODÉRÉE / EXCELLENTE ASSIMILATION' : 'MODERATE FATIGUE') :
                     tempFatigueScore <= 6 ? (language === 'fr' ? 'SENSIBLE / ADAPTATION CORRECTE' : 'SUBSTANTIAL FATIGUE') :
                     tempFatigueScore <= 8 ? (language === 'fr' ? 'ÉLEVÉE / CHARGE CARDIO MASSIVE ⚠️' : 'HIGH CARDIO LOAD ⚠️') :
                                            (language === 'fr' ? 'EXTRÊME / SUR-ENTRAÎNEMENT CRITIQUE 🚨' : 'DANGEROUS OVERTRAINING 🚨')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-5 mt-6 border-t border-white/10 text-[10px] font-mono tracking-widest">
                <button
                  onClick={() => {
                    setActiveFatigueSessionId(null);
                    addToast(
                      language === 'fr' ? 'Évaluation reportée.' : 'Assessment skipped for now.',
                      'info'
                    );
                  }}
                  className="flex-1 border border-white/10 py-3.5 bg-transparent text-white/60 hover:text-white transition-all uppercase font-black cursor-pointer"
                  disabled={isSubmittingFatigue}
                >
                  {language === 'fr' ? 'PASSER' : 'SKIP'}
                </button>
                <button
                  onClick={handleFatigueSubmit}
                  className="flex-1 bg-[#CCFF00] text-black font-black py-3.5 transition-all rounded-none uppercase flex items-center justify-center gap-2 hover:bg-white cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.2)] disabled:bg-white/10 disabled:text-white/20 disabled:shadow-none"
                  disabled={isSubmittingFatigue}
                >
                  {isSubmittingFatigue ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'fr' ? 'CHARGEMENT IA...' : 'COACH IA RUN...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{language === 'fr' ? 'CALCULER AJUSTEMENT' : 'GENERATE ADVISORY'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
