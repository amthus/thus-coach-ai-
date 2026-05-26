import React, { useState, useEffect } from 'react';
import { UserProfile, CoachPersona } from '../types';
import { i18n, Language } from '../i18n';
import { 
  ShieldAlert, 
  Flame, 
  Heart, 
  HelpCircle, 
  Info, 
  Cpu, 
  Sparkles,
  RefreshCw,
  Compass,
  TrendingUp,
  CircleDot
} from 'lucide-react';

interface IntelligentSidebarProps {
  profile: UserProfile;
  activeCoach: CoachPersona;
  language: Language;
  completedCount: number;
  totalCount: number;
}

export default function IntelligentSidebar({
  profile,
  activeCoach,
  language,
  completedCount,
  totalCount
}: IntelligentSidebarProps) {
  const t = i18n[language];
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [pulseChecked, setPulseChecked] = useState<boolean>(false);
  const [pulseBpm, setPulseBpm] = useState<number>(72);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);

  // 1. DYNAMIC METRIC CALCULATIONS
  const fcm = 220 - profile.age;
  const fcr = 65; // Estimated resting heart rate
  const reserve = fcm - fcr;

  // Let's compute a dynamic VO2 MAX estimation
  const computeVo2Max = () => {
    let base = 35;
    if (profile.level === 'intermediaire') base = 44;
    if (profile.level === 'avance') base = 51;
    
    // Age effect
    const ageImpact = profile.age * 0.12;
    // Frequency effect
    const freqImpact = profile.frequency * 1.5;
    // Distance impact
    const distImpact = (profile.avgDistance || 5) * 0.25;

    return Math.round((base - ageImpact + freqImpact + distImpact) * 10) / 10;
  };

  const vo2Max = computeVo2Max();

  const getVo2Category = (val: number) => {
    if (val < 38) return language === 'fr' ? 'Standard' : 'Fair';
    if (val < 45) return language === 'fr' ? 'Bon' : 'Good';
    if (val < 52) return language === 'fr' ? 'Athlétique' : 'Athletic';
    return language === 'fr' ? 'Élite / Olympique' : 'Elite / Olympian';
  };

  // 2. REAL-TIME COGNITIVE INTELLIGENCE DIALOUGES
  const getDynamicPrescription = () => {
    const isFr = language === 'fr';
    const suggestions: string[] = [];

    // Check injury status
    const injuryStr = (profile.injuryHistory || '').toLowerCase();
    const hasKneeInjury = injuryStr.includes('genou') || injuryStr.includes('knee') || injuryStr.includes('rotule') || injuryStr.includes('patella');
    const hasAnkleInjury = injuryStr.includes('cheville') || injuryStr.includes('ankle') || injuryStr.includes('tendon');

    if (hasKneeInjury) {
      suggestions.push(
        isFr 
          ? "⚠️ ALERTE GENOU ACTIVED : Réduisez le 'drop' de vos chaussures et privilégiez une cadence élevée (175+ ppm) pour décharger l'articulation fémoro-patellaire."
          : "⚠️ KNEE COMPLIANCE ALERT: Reduce shoe drop of your footwear and target high cadence (175+ ppm) to minimize patellofemoral load."
      );
    } else if (hasAnkleInjury) {
      suggestions.push(
        isFr
          ? "⚠️ SÉCURITÉ CHEVILLE : Évitez les sentiers instables. Utilisez des chaussures à bon maintien latéral."
          : "⚠️ ANKLE CONSTRAINT: Stay off highly uneven surfaces. Focus on neutral lateral stability shoes."
      );
    } else if (injuryStr.trim().length > 0) {
      suggestions.push(
        isFr
          ? `⚠️ RECOMMANDATION DE PROTECTION : Attention à la contrainte sur: "${profile.injuryHistory}". Restez sur des surfaces régulières.`
          : `⚠️ PROTECTION MEMORANDUM: Guard your "${profile.injuryHistory}" area. Prefer smooth urban layouts.`
      );
    }

    // Level-specific advice
    if (profile.level === 'debutant') {
      suggestions.push(
        isFr
          ? "💡 RÈGLE DES 10% : N'augmentez jamais votre volume kilométrique de plus de 10% d'une semaine à l'autre."
          : "💡 THE 10% RULE: Avoid increasing your cumulative volume by more than 10% week-over-week."
      );
      suggestions.push(
        isFr
          ? "👟 RECOMMANDATION FOULÉE : Ne forcez pas la foulée medio-pied si elle n'est pas naturelle; l'attaque talon modérée réduit le risque de blessure au mollet."
          : "👟 BIO-PACE ADVICE: Allow a standard heel-strike if natural. Avoid forceful forefoot-strikes to prevent early calves fatigue."
      );
    } else if (profile.level === 'avance') {
      suggestions.push(
        isFr
          ? "🎯 CONSEIL SÉLECTION CARBONE : Réservez vos chaussures à plaque de carbone uniquement pour les sessions de Seuil ou VMA et la compétition."
          : "🎯 CARBON COMPLIANCE: Limit carbon-plated footwear to high-intensity threshold/interval drills or actual race days."
      );
    }

    // Hydration advice based on distance
    const estDuration = profile.avgDistance * 6; // Average running duration estimation
    if (estDuration > 45) {
      suggestions.push(
        isFr
          ? `🥤 HYDRO-NUTRITION RECOMMANDÉE : Prévoyez 150ml d'eau par tranche de 20 minutes de course (votre moyenne estimée : ${profile.avgDistance} km).`
          : `🥤 DYNAMIC HYDRATION: Plan for 150ml of water intake per 20 minutes of running (based on average ${profile.avgDistance} km duration).`
      );
    }

    // Objective advice
    if (profile.objective === 'marathon' || profile.objective === 'semi') {
      suggestions.push(
        isFr
          ? "⏳ ENDURANCE LIPIDIQUE : Pratiquez une fois toutes les deux semaines une séance à jeun pour optimiser l'utilisation métabolique des lipides."
          : "⏳ LIPID OXIDATION: Practice light fasting runs bi-weekly to improve your fat-burning metabolic pathways."
      );
    } else if (profile.objective === 'vitesse' || profile.objective === '5k') {
      suggestions.push(
        isFr
          ? "⚡ TECHNIQUE CADENCE MAX : Faites 4 lignes droites de 80m en accélération progressive après chaque footing simple."
          : "⚡ STRIDE ACCELERATION: Execute 4 progressive stride accelerations of 80m post easy-runs to prime your nervous motor pathways."
      );
    }

    // Coach specific tip integration
    if (activeCoach.id === 'michel') {
      suggestions.push(
        isFr
          ? "🔥 PUNCH MICHEL : 'La fatigue n'est qu'une information sensorielle. Dépasse la barrière mentale après le 6ème kilomètre !'"
          : "🔥 MICHEL DYNAMIC ENERGY: 'Fatigue is merely electrical warning feedback. Shatter the mental barrier after KM 6!'"
      );
    } else if (activeCoach.id === 'helene') {
      suggestions.push(
        isFr
          ? "🔬 ANALYSE D'HÉLÈNE : 'Optimisez votre stockage de glycogène. Consommez 60g de glucides par heure dès que la séance dépasse 70 minutes.'"
          : "🔬 HELENE GLYCOGEN DRIFT: 'Maximize recovery storage. Aim for 60g of high glycemic index carbohydrates past the 70-minute peak.'"
      );
    } else {
      suggestions.push(
        isFr
          ? "🛡️ CRITÉRE DE CHLOÉ : 'La fréquence cardiaque est souveraine. Si votre pouls dépasse de 5 BPM votre cible en zone de récupération, marchez pendant 1 minute.'"
          : "🛡️ CHLOE SYSTEMIC FOCUS: 'Heart rate telemetry is golden. If your pulse drifts 5 BPM past target caps, introduce a 1-minute walk cycle.'"
      );
    }

    return suggestions;
  };

  const currentCoachAdvices = getDynamicPrescription();

  // Pulse simulation metric generator
  const triggerPulseCheck = () => {
    setIsMeasuring(true);
    let count = 0;
    const interval = setInterval(() => {
      setPulseBpm(prev => {
        const next = Math.floor(Math.random() * 5) - 2;
        return Math.max(60, Math.min(180, prev + next));
      });
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsMeasuring(false);
        setPulseChecked(true);
      }
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* 1. SUPER COGNITIVE CENTRAL TELEMETRY GATEWAY */}
      <div className="bg-[#0F0F0F] border border-white/10 p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00]" />
        
        {/* Header telemetry with active brand */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5 font-mono">
          <div className="flex items-center gap-2">
            <Cpu className="w-4.5 h-4.5 text-[#CCFF00] animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-[#CCFF00] uppercase">
              STRIDE_COGNITIVE v1.2
            </span>
          </div>
          <span className="text-[8px] bg-white/5 border border-white/10 text-white/50 px-1.5 py-0.5 uppercase">
            {language === 'fr' ? 'Actif' : 'Online'}
          </span>
        </div>

        {/* Dynamic estimated VO2 Max Indicator */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-end text-white/40 text-[9px] uppercase font-black font-mono">
              <span>{language === 'fr' ? 'INDICE METABOLIQUE ESTIMÉ' : 'ESTIMATED VO2 MAX CAP'}</span>
              <span className="text-[#CCFF00] font-black text-xs">{vo2Max} ML/MIN/KG</span>
            </div>
            
            {/* Custom styled scale */}
            <div className="relative mt-2">
              <div className="w-full bg-[#1A1A1A] h-2 border border-white/10 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 via-[#CCFF00] to-teal-400 h-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(10, ((vo2Max - 25) / 40) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-[10px] font-mono text-white/20 mt-1 uppercase">
                <span>Min</span>
                <span>{getVo2Category(vo2Max)}</span>
                <span>Max</span>
              </div>
            </div>
          </div>

          {/* Dynamic Stride stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
            <div className="bg-black/50 p-2.5 border border-white/5 space-y-1">
              <span className="text-[8px] text-white/30 tracking-wider block uppercase">
                {language === 'fr' ? 'PULSATIONS CIBLE' : 'TARGET FCM CAP'}
              </span>
              <span className="text-xs font-black text-white">{fcm} BPM</span>
            </div>
            <div className="bg-black/50 p-2.5 border border-white/5 space-y-1">
              <span className="text-[8px] text-white/30 tracking-wider block uppercase">
                {language === 'fr' ? 'CADENCE RECO.' : 'TARGET CADENCE'}
              </span>
              <span className="text-xs font-black text-white">
                {profile.level === 'avance' ? '178 - 185 PPM' : profile.level === 'intermediaire' ? '170 - 178 PPM' : '162 - 170 PPM'}
              </span>
            </div>
          </div>

          {/* Bio Metric Heart Rate Simulator Scanner inside Sidebar */}
          <div className="bg-black/50 border border-white/5 p-2.5 font-mono text-[10px] space-y-2">
            <div className="flex justify-between items-center text-[8px] text-white/40 uppercase font-black">
              <span>{language === 'fr' ? 'MONITEUR CARDIO SIMULÉ v2' : 'SIMULATED CARDIO DIAL'}</span>
              {isMeasuring ? (
                <span className="text-[#CCFF00] animate-ping">●</span>
              ) : (
                <span className="text-white/20">○</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className={`w-4 h-4 text-rose-500 ${isMeasuring ? 'animate-bounce' : ''}`} />
                <span className="text-white font-black text-xs">
                  {isMeasuring ? 'CALCULATING...' : `${pulseBpm} BPM`}
                </span>
              </div>
              <button
                onClick={triggerPulseCheck}
                disabled={isMeasuring}
                className="bg-white/5 hover:bg-[#CCFF00] hover:text-black border border-white/10 px-2 py-1 text-[8px] font-bold text-white uppercase transition-all whitespace-nowrap cursor-pointer disabled:bg-transparent disabled:text-white/20"
              >
                {isMeasuring ? (language === 'fr' ? 'SCAN...' : 'SCAN...') : (language === 'fr' ? 'SIMULER POULS' : 'SCAN PULSE')}
              </button>
            </div>
            {pulseChecked && !isMeasuring && (
              <p className="text-[8.5px] text-[#CCFF00] italic leading-tight uppercase">
                {language === 'fr' 
                  ? `✓ Pulsation simulée synchrone : ${pulseBpm < 80 ? 'Repos métabolique' : 'Activité active'}` 
                  : `✓ Simulated pulse synced: ${pulseBpm < 80 ? 'Metabolic recovery state' : 'Active workload state'}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC PRESCRIPTION ENGINE */}
      <div className="bg-[#0F0F0F] border border-white/10 p-5 relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-2 h-16 bg-[#CCFF00]" />
        
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Sparkles className="w-4 h-4 text-[#CCFF00] animate-spin" />
          <h3 className="font-sans font-black text-xs text-white uppercase tracking-wider">
            {language === 'fr' ? 'PRESCRIPTIONS COGNITIVES INSTANTANÉES' : 'INTELLIGENT PRESCRIPTION HUB'}
          </h3>
        </div>

        <div className="space-y-3.5 max-h-76 overflow-y-auto pr-1">
          {currentCoachAdvices.map((advice, index) => (
            <div 
              key={index} 
              className="p-3 bg-black/40 border-l border-white/10 uppercase font-mono text-[9.5px] tracking-wide leading-relaxed space-y-1 text-white/80 animate-fade-in"
            >
              <div className="flex items-center justify-between text-[8px] text-[#CCFF00]/60 font-black">
                <span>[RULE_ID: {(index + 101).toString(16).toUpperCase()}]</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="normal-case font-sans italic text-white text-[11px] font-medium leading-relaxed">
                {advice}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/20 p-3 flex flex-col gap-1 text-[9px] font-mono leading-tight">
          <span className="text-[#CCFF00] font-black uppercase text-[10px] tracking-wider mb-1 block">
            {language === 'fr' ? 'ANALYSE DU FLUX DE TRAVAIL' : 'PROCESSOR TELEMETRY'}
          </span>
          <div className="flex justify-between">
            <span className="text-white/40">OBJECTIF CRITIQUE:</span>
            <span className="text-white font-bold uppercase">{profile.objective}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">SÉANCES ARCHIVÉES:</span>
            <span className="text-white font-bold">{completedCount} / {totalCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">CONTRAT DE L'IA:</span>
            <span className="text-[#CCFF00] font-bold">Malthus AMETEPE</span>
          </div>
        </div>
      </div>

      {/* 3. INTEL SPECIAL BRAND SIGNATURE PANEL */}
      <div className="bg-black/40 border border-white/5 p-4 text-center space-y-2 relative font-mono text-[9px] uppercase tracking-wider">
        <p className="text-white/40">
          DEVELOPED BY <span className="text-white font-black">ThusDev</span>
        </p>
        <div className="text-white/30 text-[8px] leading-relaxed">
          ARCHITECTURAL PLATFORM ENGINEERED FOR
          <span className="text-[#CCFF00] block font-black mt-0.5">Malthus AMETEPE</span>
        </div>
      </div>
    </div>
  );
}
