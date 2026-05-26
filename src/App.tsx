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
import ReadmeTemplateBuilder from './components/ReadmeTemplateBuilder';
import { 
  Activity, 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  BookOpen, 
  User, 
  TrendingUp, 
  Flame, 
  RotateCcw, 
  Plus, 
  Loader2, 
  ShieldAlert,
  Info
} from 'lucide-react';

// Defining our professional sports coaches
const coaches: CoachPersona[] = [
  {
    id: 'michel',
    name: 'Coach Michel ⚡',
    avatar: '🏃‍♂️',
    description: 'Le Motivateur Énergique',
    style: 'Dynamique',
    systemPrompt: "Tu es un coach hyper dynamique, enthousiaste de course à pied, qui utilise beaucoup d'expressions motivantes ('Allez champion !', 'On lâche rien !'). Tu donnes des conseils précis pour garder le moral et s'amuser."
  },
  {
    id: 'helene',
    name: 'Coach Hélène 📊',
    avatar: '👩‍🔬',
    description: "La Scientifique de l'Effort",
    style: 'Méthodique',
    systemPrompt: "Tu es une coach de renommée très axée sur la physiologie de l'effort physique. Tu parles de seuil anaérobie, de FCM (Fréquence Cardiaque Maximale), d'allures précises, et d'importance de l'endurance fondamentale pour développer le réseau capillaire."
  },
  {
    id: 'chloe',
    name: 'Coach Chloé 🌸',
    avatar: '🧘‍♀️',
    description: "La Coach Bienveillante",
    style: 'Bienveillante',
    systemPrompt: "Tu es une coach douce et à l'écoute. Tu insistes à 100% sur le bien-être, l'absence absolue de douleurs articulaires, la souplesse, le renforcement général, et le plaisir simple de la course en pleine nature."
  }
];

export default function App() {
  // 1. Core State
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
  
  // Tabs and UI States
  const [activeTab, setActiveTab] = useState<'plan' | 'chat' | 'readme'>('plan');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // 2. Load Persisted State from LocalStorage
  useEffect(() => {
    const savedPlan = localStorage.getItem('coach_running_plan');
    const savedCompleted = localStorage.getItem('coach_completed_sessions');
    const savedProfile = localStorage.getItem('coach_athlete_profile');
    const savedCoachId = localStorage.getItem('coach_active_id');

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
  }, []);

  // Update initial chat triggers when a plan is loaded or changed
  useEffect(() => {
    if (plan) {
      // Setup a structured greeting from the active coach
      setChatMessages([
        {
          id: 'welcome',
          sender: 'coach',
          text: `Bonjour champion ! Je suis ravi de t'accompagner. J'ai conçu ton plan d'entraînement "${plan.objectiveLabel}" spécialement pour un niveau de départ "${plan.levelLabel}".\n\nN'hésite pas à me poser tes questions sur tes allures, tes chaussures, l'échauffement ou la récupération active ! Comment s'est passée ta dernière sortie ?`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setChatMessages([
        {
          id: 'welcome-no-plan',
          sender: 'coach',
          text: `Salut ! Remplis d'abord le formulaire de profil à gauche et clique sur "Créer mon programme" pour que je puisse te composer un calendrier d'entraînement sur-mesure !`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [plan, activeCoach]);

  // 3. Handlers
  const handleProfileChange = (key: keyof UserProfile, value: any) => {
    const updated = { ...profile, [key]: value };
    // Safe-guard frequency of running
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
        body: JSON.stringify({ profile, coachPersona: activeCoach })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue lors de la création du plan.");
      }

      const generatedPlan: TrainingPlan = await response.json();
      setPlan(generatedPlan);
      setCompletedSessions({}); // Reset completion ratios
      
      // Persist in localStorage
      localStorage.setItem('coach_running_plan', JSON.stringify(generatedPlan));
      localStorage.setItem('coach_completed_sessions', JSON.stringify({}));
      
      setActiveTab('plan'); // Switch to plan view
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Erreur réseau.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Checkbox toggle for a session
  const toggleSessionCompletion = (sessionId: string) => {
    const updated = {
      ...completedSessions,
      [sessionId]: !completedSessions[sessionId]
    };
    setCompletedSessions(updated);
    localStorage.setItem('coach_completed_sessions', JSON.stringify(updated));
  };

  // Communication with Gemini
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSendingMessage) return;

    // 1. Add user message to history
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
          coachPersona: activeCoach
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de communication.");
      }

      const result = await response.json();
      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: result.text || "Pardon, je n'ai pas pu formuler ma réponse.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, coachMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `coach-error-${Date.now()}`,
        sender: 'coach',
        text: `⚠️ Erreur : ${err.message || "Impossible de joindre le coach. Assurez-vous d'avoir configuré votre GEMINI_API_KEY."}`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Reset core metrics
  const resetAllData = () => {
    if (confirm("Voulez-vous réinitialiser votre programme de course et votre profil ?")) {
      localStorage.removeItem('coach_running_plan');
      localStorage.removeItem('coach_completed_sessions');
      setPlan(null);
      setCompletedSessions({});
      setErrorStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#CCFF00] selection:text-black">
      
      {/* Brutalist Style Header */}
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 sm:px-10 shrink-0 bg-[#0F0F0F] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#CCFF00] rounded-none rotate-45 shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
          <span className="font-black text-2xl tracking-tighter uppercase font-display italic flex items-center gap-1.5 text-white">
            Stride<span className="text-[#CCFF00]">_IA</span>
          </span>
        </div>

        {/* Dynamic header navigation representing high-tier steps */}
        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-widest">
          <button 
            onClick={() => setActiveTab('plan')} 
            className={`transition-all hover:text-[#CCFF00] uppercase ${activeTab === 'plan' ? 'text-[#CCFF00]' : 'text-white/40'}`}
          >
            01. CALENDRIER
          </button>
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`transition-all hover:text-[#CCFF00] uppercase ${activeTab === 'chat' ? 'text-[#CCFF00]' : 'text-white/40'}`}
          >
            02. COACH CHAT
          </button>
          <button 
            onClick={() => setActiveTab('readme')} 
            className={`transition-all hover:text-[#CCFF00] uppercase ${activeTab === 'readme' ? 'text-[#CCFF00]' : 'text-white/40'}`}
          >
            03. GITHUB PORTFOLIO
          </button>
        </div>

        <div className="flex items-center gap-3">
          {plan && (
            <button
              onClick={resetAllData}
              className="bg-white/5 hover:bg-white text-white hover:text-black hover:border-white text-[10px] font-mono uppercase tracking-widest border border-white/10 py-1.5 px-3 transition-all cursor-pointer"
              title="Supprimer le programme actuel"
            >
              Recommencer
            </button>
          )}
          <div className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-[10px] font-mono tracking-widest text-[#CCFF00]">
            BETA 1.1
          </div>
        </div>
      </header>

      {/* Main Container / Content workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        
        {/* LEFT PROFILE PANEL: Athlete Inputs */}
        <section id="athlete-profile-section" className="lg:col-span-4 space-y-8">
          <div className="bg-[#0F0F0F] border border-white/10 p-6 shadow-2xl relative overflow-hidden">
            {/* Corner Accent marker */}
            <div className="absolute top-0 right-0 w-2 h-16 bg-[#CCFF00]" />
            <div className="absolute top-0 right-0 w-16 h-2 bg-[#CCFF00]" />
            
            <div className="space-y-1.5 mb-8">
              <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">User Profile</p>
              <h2 className="text-4xl font-black leading-none uppercase tracking-tighter italic font-display">
                ATHLETE<br />INPUTS
              </h2>
            </div>

            <div className="space-y-6">
              
              {/* Age / Frequency side-by-side inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">Âge (Ans)</label>
                  <input
                    type="number"
                    min="14"
                    max="90"
                    value={profile.age}
                    onChange={(e) => handleProfileChange('age', parseInt(e.target.value) || 30)}
                    className="w-full bg-[#1A1A1A] text-white border border-white/10 hover:border-white/20 px-3 py-2.5 text-sm font-bold font-mono focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">Sessions / Sem.</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={profile.frequency}
                    onChange={(e) => handleProfileChange('frequency', parseInt(e.target.value) || 3)}
                    className="w-full bg-[#1A1A1A] text-white border border-white/10 hover:border-white/20 px-3 py-2.5 text-sm font-bold font-mono focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">Niveau de Course</label>
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
                        {lvl === 'debutant' ? 'Novice' : lvl === 'intermediaire' ? 'Amateur' : 'Elite'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weekly distance slider */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">Footing Moyen Actuel</label>
                <div className="space-y-2 bg-[#1A1A1A] border border-white/10 p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-white/40">DISTANCE</span>
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

              {/* Selection field */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">Objectif Principal</label>
                <select
                  value={profile.objective}
                  onChange={(e) => handleProfileChange('objective', e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-white/10 hover:border-white/20 px-4 py-3 text-xs font-black uppercase tracking-wide focus:outline-none focus:border-[#CCFF00] appearance-none rounded-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px' }}
                >
                  <option value="sante">Santé & Remise en forme</option>
                  <option value="5k">Premier 5 KM Run</option>
                  <option value="10k">Réussir un 10 KM</option>
                  <option value="semi">Semi-Marathon (21.1 KM)</option>
                  <option value="marathon">Marathon Mythique (42.2 KM)</option>
                  <option value="vitesse">Vitesse pure / VO2 MAX</option>
                </select>
              </div>

              {/* Injuries */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">Contraintes Physiques / Douleurs</label>
                <input
                  type="text"
                  placeholder="Ex: Douleur au tendon droit, genou sensible"
                  value={profile.injuryHistory}
                  onChange={(e) => handleProfileChange('injuryHistory', e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-white/10 hover:border-white/20 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#CCFF00] rounded-none placeholder-white/20"
                />
              </div>

              {/* Optional detail */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest">Détail personnalisé / Date cible</label>
                <input
                  type="text"
                  placeholder="Ex: Terminer sous les 50 minutes"
                  value={profile.customObjective}
                  onChange={(e) => handleProfileChange('customObjective', e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-white/10 hover:border-white/20 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#CCFF00] rounded-none placeholder-white/20"
                />
              </div>

              {/* Dynamic Persona Selection */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <label className="block text-[10px] uppercase font-black text-white/40 tracking-widest">Choix de la Personnalité Coach</label>
                <div className="space-y-2">
                  {coaches.map((c) => {
                    const isSelected = activeCoach.id === c.id;
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
                        <span className="text-2xl">{c.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-white tracking-wider">{c.name}</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-none ${
                              isSelected ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white/40'
                            }`}>
                              {c.style}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5 uppercase truncate">{c.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error logs */}
              {errorStatus && (
                <div className="border-l-2 border-red-500 bg-red-500/5 p-4 text-xs text-red-400 space-y-1 font-mono uppercase tracking-wide">
                  <div className="flex items-center gap-2 font-black">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                    <span>ERROR STATUS ACTIVE</span>
                  </div>
                  <p className="opacity-80 text-[10px] normal-case">{errorStatus}</p>
                </div>
              )}

              {/* Form Generation Button */}
              <button
                id="btn-trigger-plan"
                onClick={generateTrainingPlan}
                disabled={isGeneratingPlan}
                className="w-full bg-[#CCFF00] text-black hover:bg-white active:scale-[0.98] transition-all duration-150 py-4 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.2)] disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none cursor-pointer"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" /> CALCUL DU PROTOCOLE...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black font-extrabold" /> GENERATE WORKOUTS 🚀
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Inline speed conversion widget */}
          <RunningPaceCalc />
        </section>

        {/* RIGHT WORKSPACE: Visual Output & Panels */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Razor-sharp high-contrast Navigation Tabs */}
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
              <span>01. CALENDRIER</span>
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
              <span>02. DISCUSSION COACH</span>
            </button>
            <button
              id="tab-view-readme"
              onClick={() => setActiveTab('readme')}
              className={`flex-1 py-3 px-4 font-display font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'readme'
                  ? 'bg-white/5 border border-white/10 text-[#CCFF00] shadow-sm font-black'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>03. DOSSIER PORTFOLIO</span>
            </button>
          </div>

          {/* Render content panels */}
          <div className="transition-all duration-300">
            {activeTab === 'plan' && (
              plan ? (
                <TrainingPlanDisplay 
                  plan={plan}
                  completedSessions={completedSessions}
                  onToggleSession={toggleSessionCompletion}
                />
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
                    <p className="text-xs text-white/60 uppercase font-medium leading-relaxed">
                      Configurez votre profil d'athlète sur la gauche puis lancez la génération. L'entraîneur façonnera un protocole d'allures et d'intensité cardiaque entièrement calibré afin d'optimiser votre potentiel cardiovasculaire en limitant le risque de surmenage.
                    </p>
                  </div>

                  {/* Preloaded technical explanation cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                    <div className="border border-white/10 bg-white/[0.01] p-5 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#CCFF00]"></div>
                      <span className="text-[10px] font-black tracking-widest text-[#CCFF00] uppercase block mb-1">01 / ENDURANCE FONDAMENTALE</span>
                      <p className="text-[11px] text-white/50 leading-relaxed uppercase">
                        La majorité des séances se fait à allure lente (FCM basse) pour étirer le ventricule gauche et stimuler la capillarisation musculaire profonde.
                      </p>
                    </div>

                    <div className="border border-white/10 bg-white/[0.01] p-5 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-white/20"></div>
                      <span className="text-[10px] font-black tracking-widest text-white/40 uppercase block mb-1">02 / ÉTIOLOGIE DU CALCUL</span>
                      <p className="text-[11px] text-white/50 leading-relaxed uppercase">
                        La planification intègre vos pathologies antérieures complexes pour lisser les pics de contraintes du volume de course.
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
              />
            )}

            {activeTab === 'readme' && (
              <ReadmeTemplateBuilder 
                profile={profile}
                plan={plan}
              />
            )}
          </div>

        </section>
      </main>

      {/* Sportive Branding Grid footer */}
      <footer className="bg-[#0F0F0F] border-t border-white/10 py-8 px-10 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
            <span className="font-display font-black text-xl italic uppercase tracking-tighter text-white">STRIDE_IA</span>
            <span className="text-[10px] font-mono border border-white/20 py-0.5 px-2 text-white">RECR_01</span>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 text-center md:text-right">
            POWERED BY GOOGLE GEMINI 1.5 & 2.0 • PROTOCOLE ATHLETIQUE MULTI-COACH REGISTERED
          </p>
        </div>
      </footer>
    </div>
  );
}
