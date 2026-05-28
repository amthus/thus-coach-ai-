/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { i18n, Language } from '../i18n';
import { Heart, Activity, ShieldAlert, BarChart3, Apple, Scale, Droplet, Flame, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { TrainingPlan } from '../types';

interface PhysiologyDashboardProps {
  language: Language;
  athleteAge: number;
  plan?: TrainingPlan | null;
  completedSessions?: Record<string, boolean>;
}

export default function PhysiologyDashboard({ 
  language, 
  athleteAge, 
  plan, 
  completedSessions 
}: PhysiologyDashboardProps) {
  const t = i18n[language];

  const estimatedFcm = 220 - athleteAge;
  const [fcm, setFcm] = useState(estimatedFcm);
  const [fcr, setFcr] = useState(60);
  const [weight, setWeight] = useState<number>(70);
  const [activeWeekNum, setActiveWeekNum] = useState<number>(1);
  const [simulatedIntensity, setSimulatedIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');

  // TARGETED PHYSIOLOGICAL NUTRITION CALCULATIONS
  let currentIntensityLabel = language === 'fr' ? 'Endurance Fondamentale (Modérée)' : 'Endurance Base (Moderate)';
  let carbsFactor = 5.5; // g/kg
  let proteinFactor = 1.4; // g/kg
  let fatsFactor = 1.0; // g/kg
  let calculatedDuration = 0;
  let calculatedIntensity = 0;
  let weeklyFocus = '';

  if (plan && plan.weeks && plan.weeks.length > 0) {
    const weekObj = plan.weeks.find(w => w.weekNumber === activeWeekNum) || plan.weeks[0];
    if (weekObj) {
      weeklyFocus = weekObj.focus;
      calculatedDuration = weekObj.sessions.reduce((sum, s) => s.type !== 'repos' ? sum + s.durationMinutes : sum, 0);
      calculatedIntensity = weekObj.sessions.length > 0
        ? Math.round(weekObj.sessions.reduce((sum, s) => sum + s.intensityPercent, 0) / weekObj.sessions.length)
        : 0;

      if (calculatedDuration >= 180 || calculatedIntensity >= 78) {
        currentIntensityLabel = language === 'fr' ? 'Surcharge Cardio Élevée (Intensif)' : 'High Cardio Training Load (Intense)';
        carbsFactor = 7.5;
        proteinFactor = 1.6;
        fatsFactor = 1.1;
      } else if (calculatedDuration < 95) {
        currentIntensityLabel = language === 'fr' ? 'Récupération Active (Léger)' : 'Active Recovery (Light)';
        carbsFactor = 4.2;
        proteinFactor = 1.25;
        fatsFactor = 0.9;
      } else {
        currentIntensityLabel = language === 'fr' ? 'Volume Aérobie Stable (Modéré)' : 'Stable Aerobic Volume (Moderate)';
        carbsFactor = 5.8;
         proteinFactor = 1.45;
        fatsFactor = 1.0;
      }
    }
  } else {
    if (simulatedIntensity === 'intense') {
      currentIntensityLabel = language === 'fr' ? 'Surcharge Cardio Élevée (Intensif)' : 'High Cardio Training Load (Intense)';
      carbsFactor = 7.5;
      proteinFactor = 1.6;
      fatsFactor = 1.1;
    } else if (simulatedIntensity === 'light') {
      currentIntensityLabel = language === 'fr' ? 'Récupération Active (Léger)' : 'Active Recovery (Light)';
      carbsFactor = 4.2;
      proteinFactor = 1.25;
      fatsFactor = 0.9;
    } else {
      currentIntensityLabel = language === 'fr' ? 'Volume Aérobie Stable (Modéré)' : 'Stable Aerobic Volume (Moderate)';
      carbsFactor = 5.8;
      proteinFactor = 1.45;
      fatsFactor = 1.0;
    }
  }

  const carbsGrams = Math.round(carbsFactor * weight);
  const proteinGrams = Math.round(proteinFactor * weight);
  const fatsGrams = Math.round(fatsFactor * weight);
  const totalKcal = Math.round((carbsGrams * 4) + (proteinGrams * 4) + (fatsGrams * 9));

  const nutritionText = {
    fr: {
      title: "Nutrition Physiologique de l'Athlète",
      desc: "Recommandations nutritionnelles périodisées selon la charge d'entraînement et le poids corporel.",
      weightLabel: "Poids Corporel de l'Athlète (KG)",
      intensityLabel: "Intensité de la Charge Hebdomadaire :",
      weeklyFocusLabel: "Axe technique de développement :",
      carbsTitle: "Glucides (Énergie)",
      proteinTitle: "Protéines (Récupération Musculaire)",
      fatsTitle: "Lipides (Soutien Hormonal)",
      kcalLabel: "Budget Calorique Quotidien Cible",
      hydrationAlert: "Hydratation Athlétique : Un minimum de 2,5 L à 3 L d'eau minérale est requis pour éliminer les toxines musculaires et optimiser l'enclenchement aérobie.",
      noPlanLabel: "Simuler la charge d'entraînement pour calculer les macros :",
      weekSelectorLabel: "Sélectionner la semaine du protocole actif :",
      sourcesLabel: "Sources de qualité à privilégier :"
    },
    en: {
      title: "Athlete Physiological Nutrition Blueprint",
      desc: "Nutritional profiling periodized dynamically based on athletic load and raw body weight.",
      weightLabel: "Athlete Body Weight (KG)",
      intensityLabel: "Weekly Load Intensity:",
      weeklyFocusLabel: "Technical focal path:",
      carbsTitle: "Carbohydrates (Energy Matrix)",
      proteinTitle: "Protein (Tissue Repair)",
      fatsTitle: "Fats (Endocrine Support)",
      kcalLabel: "Target Daily Caloric Budget",
      hydrationAlert: "Athletic Hydration: A minimum of 2.5L to 3.0L of mineralized water is recommended on intensive training days to prevent cellular cramping.",
      noPlanLabel: "Simulate training intensity load to calculate macros:",
      weekSelectorLabel: "Select simulated training week:",
      sourcesLabel: "High-quality suggested foods:"
    }
  }[language];

  useEffect(() => {
    setFcm(220 - athleteAge);
  }, [athleteAge]);

  const fcrReserve = Math.max(fcm - fcr, 0);

  const calculateZoneBpm = (minPercent: number, maxPercent: number) => {
    const minBpm = Math.round(fcr + (minPercent / 100) * fcrReserve);
    const maxBpm = Math.round(fcr + (maxPercent / 100) * fcrReserve);
    return `${minBpm} - ${maxBpm} BPM`;
  };

  const z1Min = Math.round(fcr + 0.5 * fcrReserve);
  const z1Max = Math.round(fcr + 0.6 * fcrReserve);
  const z2Min = Math.round(fcr + 0.6 * fcrReserve);
  const z2Max = Math.round(fcr + 0.7 * fcrReserve);
  const z3Min = Math.round(fcr + 0.7 * fcrReserve);
  const z3Max = Math.round(fcr + 0.8 * fcrReserve);
  const z4Min = Math.round(fcr + 0.8 * fcrReserve);
  const z4Max = Math.round(fcr + 0.9 * fcrReserve);
  const z5Min = Math.round(fcr + 0.9 * fcrReserve);
  const z5Max = Math.round(fcr + 1.0 * fcrReserve);

  const zones = [
    {
      title: t.physioZone1,
      desc: t.physioZone1Desc,
      range: `${z1Min} - ${z1Max} BPM`,
      color: 'border-l-sky-500 text-sky-400',
      bg: 'bg-sky-500/5',
    },
    {
      title: t.physioZone2,
      desc: t.physioZone2Desc,
      range: `${z2Min} - ${z2Max} BPM`,
      color: 'border-l-[#CCFF00] text-[#CCFF00]',
      bg: 'bg-[#CCFF00]/5',
    },
    {
      title: t.physioZone3,
      desc: t.physioZone3Desc,
      range: `${z3Min} - ${z3Max} BPM`,
      color: 'border-l-orange-500 text-orange-400',
      bg: 'bg-orange-500/5',
    },
    {
      title: t.physioZone4,
      desc: t.physioZone4Desc,
      range: `${z4Min} - ${z4Max} BPM`,
      color: 'border-l-rose-500 text-rose-400',
      bg: 'bg-rose-500/5',
    },
    {
      title: t.physioZone5,
      desc: t.physioZone5Desc,
      range: `${z5Min} - ${z5Max} BPM`,
      color: 'border-l-red-600 text-red-500',
      bg: 'bg-red-500/5',
    },
  ];

  // Recharts formatted dataset
  const chartData = [
    { name: 'Z1', range: [z1Min, z1Max], label: language === 'fr' ? 'Récupération' : 'Recovery', color: '#0ea5e9' },
    { name: 'Z2', range: [z2Min, z2Max], label: language === 'fr' ? 'Endurance' : 'Aerobic Base', color: '#CCFF00' },
    { name: 'Z3', range: [z3Min, z3Max], label: language === 'fr' ? 'Aérobie' : 'Aerobic Power', color: '#f97316' },
    { name: 'Z4', range: [z4Min, z4Max], label: language === 'fr' ? 'Seuil' : 'Threshold', color: '#f43f5e' },
    { name: 'Z5', range: [z5Min, z5Max], label: language === 'fr' ? 'VMA' : 'VO2 Max', color: '#dc2626' },
  ];

  const yDomainMin = Math.max(Math.round(fcr - 15), 30);
  const yDomainMax = Math.round(fcm + 10);

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#111] border border-white/10 p-3 font-mono text-[10px] uppercase space-y-1 rounded-none shadow-xl">
          <p className="font-bold text-[#CCFF00]">{data.name} - {data.label}</p>
          <p className="text-white/80">{language === 'fr' ? 'CIBLE CARDIAQUE :' : 'TARGET STRIDE :'} <span className="font-black text-white">{data.range[0]} - {data.range[1]} BPM</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0F0F0F] border border-white/10 p-6 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00]" />
      
      <div className="space-y-1 mb-6">
        <h3 className="font-display font-black text-2xl text-white uppercase tracking-tighter italic">
          {t.physioTitle}
        </h3>
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-relaxed">
          {t.physioDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-black/40 border border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#CCFF00]" />
            <label className="text-[10px] uppercase font-black text-white/60 tracking-widest">
              {t.physioFcm}
            </label>
          </div>
          <input
            type="number"
            min="100"
            max="240"
            value={fcm}
            onChange={(e) => setFcm(parseInt(e.target.value) || estimatedFcm)}
            className="w-full bg-[#1A1A1A] text-white border border-white/10 px-3 py-2.5 text-sm font-bold font-mono focus:outline-none focus:border-[#CCFF00]"
          />
          <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
            {t.physioFcmDesc}
          </p>
        </div>

        <div className="bg-black/40 border border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/60" />
            <label className="text-[10px] uppercase font-black text-white/60 tracking-widest">
              {t.physioFcr}
            </label>
          </div>
          <input
            type="number"
            min="30"
            max="120"
            value={fcr}
            onChange={(e) => setFcr(parseInt(e.target.value) || 60)}
            className="w-full bg-[#1A1A1A] text-white border border-white/10 px-3 py-2.5 text-sm font-bold font-mono focus:outline-none focus:border-[#CCFF00]"
          />
          <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
            {t.physioFcrDesc}
          </p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-white/10 p-4 mb-6 flex justify-between items-center text-xs font-mono uppercase tracking-wide">
        <span className="text-white/40">{t.physioReserve}:</span>
        <span className="text-[#CCFF00] font-black">{fcrReserve} BPM</span>
      </div>

      {/* Recharts Cardio Zones Chart Visualizer */}
      <div id="heart-rate-chart" className="bg-black/40 border border-white/10 p-4 mb-6 relative">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-[#CCFF00]" />
          <span className="text-[10px] uppercase font-black text-white/60 tracking-widest">
            {language === 'fr' ? 'DYNAMIQUE DES RANGS CARDIAQUES (KARVONEN)' : 'CARDIO HEART RATE SPANS (KARVONEN)'}
          </span>
        </div>
        
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                domain={[yDomainMin, yDomainMax]} 
                stroke="#666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickCount={5}
              />
              <Tooltip content={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="range" radius={2}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        {zones.map((zone, index) => (
          <div
            key={index}
            className={`border-l-4 p-4 ${zone.color} ${zone.bg} border-t border-b border-r border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4`}
          >
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wide">
                {zone.title}
              </h4>
              <p className="text-[10px] font-mono uppercase text-white/50 leading-relaxed max-w-xl">
                {zone.desc}
              </p>
            </div>
            <div className="font-mono text-sm font-black tracking-widest shrink-0 uppercase bg-black px-3.5 py-1.5 border border-white/10 text-right">
              {zone.range}
            </div>
          </div>
        ))}
      </div>

      {/* Target Physiology Nutrition Tracking Widget */}
      <div className="border border-white/10 bg-[#0A0A0A] p-6 font-mono uppercase space-y-6">
        
        {/* Header telemetry band */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Apple className="w-4 h-4 text-[#CCFF00]" />
              <span>{nutritionText.title}</span>
            </h3>
            <p className="text-[10px] text-white/50 tracking-wide font-normal max-w-xl">
              {nutritionText.desc}
            </p>
          </div>

          <div className="bg-black/60 border border-white/10 px-4 py-2 sm:text-right">
            <span className="text-[9px] text-[#CCFF00] font-black tracking-widest block leading-none">
              {nutritionText.kcalLabel}
            </span>
            <span className="text-xl font-black text-white block mt-1">
              🔥 {totalKcal} <span className="text-[10px] text-white/50 font-normal">KCAL</span>
            </span>
          </div>
        </div>

        {/* Dynamic adjust slider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.01] p-4 border border-white/5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black text-white/60">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#CCFF00]" />
                {nutritionText.weightLabel}
              </span>
              <span className="text-white text-xs bg-black px-2 py-0.5 border border-white/10">
                {weight} KG
              </span>
            </div>
            
            <input 
              type="range" 
              min="40" 
              max="130" 
              value={weight} 
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-[#CCFF00] bg-white/10 h-1 cursor-pointer appearance-none rounded-none outline-none"
            />
            
            <div className="flex justify-between text-[8px] text-white/30 font-bold">
              <span>40 KG</span>
              <span>85 KG</span>
              <span>130 KG</span>
            </div>
          </div>

          <div className="space-y-2">
            {plan && plan.weeks && plan.weeks.length > 0 ? (
              <>
                <span className="text-[10px] font-black text-white/60 block">
                  {nutritionText.weekSelectorLabel}
                </span>
                <div className="flex gap-2">
                  {plan.weeks.map((w) => (
                    <button
                      key={w.weekNumber}
                      onClick={() => setActiveWeekNum(w.weekNumber)}
                      className={`flex-1 py-1.5 text-[10px] font-black border transition-all cursor-pointer ${
                        activeWeekNum === w.weekNumber
                          ? 'bg-[#CCFF00] border-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.15)]'
                          : 'bg-black/40 border-white/10 hover:border-white text-white/60 hover:text-white'
                      }`}
                    >
                      {language === 'fr' ? `S${w.weekNumber}` : `W${w.weekNumber}`}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black text-white/60 block">
                  {nutritionText.noPlanLabel}
                </span>
                <div className="flex gap-2">
                  {(['light', 'moderate', 'intense'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSimulatedIntensity(mode)}
                      className={`flex-1 py-1.5 text-[9px] font-black border transition-all cursor-pointer uppercase ${
                        simulatedIntensity === mode
                          ? 'bg-[#CCFF00] border-[#CCFF00] text-black font-black'
                          : 'bg-black/40 border-white/10 hover:border-white text-white/60 hover:text-white'
                      }`}
                    >
                      {mode === 'light' ? (language === 'fr' ? 'Léger' : 'Light') : 
                        mode === 'moderate' ? (language === 'fr' ? 'Modéré' : 'Moderate') : 
                        (language === 'fr' ? 'Intensif' : 'Intense')}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Load Status breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-white/5 bg-black/30 p-4 text-[10px]">
          <div className="space-y-1">
            <span className="font-bold text-white/40 block">{nutritionText.intensityLabel}</span>
            <span className="font-black text-white block">{currentIntensityLabel}</span>
            {plan && plan.weeks && plan.weeks.length > 0 && (
              <span className="text-[9px] text-white/40 block mt-0.5 uppercase">
                {language === 'fr' ? 'SÉANCE VOLUME :' : 'SESSION VOLUME :'} {calculatedDuration} MIN ({calculatedIntensity}% FCM)
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            <span className="font-bold text-white/40 block">{nutritionText.weeklyFocusLabel}</span>
            <span className="font-black text-amber-500 block truncate">
              {weeklyFocus || (language === 'fr' ? 'DÉVELOPPEMENT CAPACITÉ AÉROBIE PHYSIOLOGIQUE' : 'PHYSIOLOGICAL AEROBIC STAMINA DEPLOYMENT')}
            </span>
          </div>
        </div>

        {/* 3 Column macros card layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/40 border-t-2 border-emerald-500 p-4 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black text-emerald-500">
              <span>{nutritionText.carbsTitle}</span>
              <span className="text-white/40 font-bold">{carbsFactor} G/KG</span>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-black text-white tracking-tight">{carbsGrams}G</div>
              <div className="h-1 bg-white/5 w-full">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${Math.min((carbsFactor / 10) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-white/5">
              <span className="text-[8px] text-white/40 font-black tracking-widest block uppercase">
                {nutritionText.sourcesLabel}
              </span>
              <p className="text-[10px] text-white/70 font-sans tracking-wide leading-relaxed normal-case">
                {language === 'fr' 
                  ? "Patates douces, riz basmati, avoine complète, quinoa, pain complet, bananes." 
                  : "Sweet potatoes, basmati rice, rolled oats, quinoa, whole grain bread, bananas."}
              </p>
            </div>
          </div>

          <div className="bg-black/40 border-t-2 border-amber-500 p-4 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black text-amber-500">
              <span>{nutritionText.proteinTitle}</span>
              <span className="text-white/40 font-bold">{proteinFactor} G/KG</span>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-black text-white tracking-tight">{proteinGrams}G</div>
              <div className="h-1 bg-white/5 w-full">
                <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${Math.min((proteinFactor / 2.2) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-white/5">
              <span className="text-[8px] text-white/40 font-black tracking-widest block uppercase">
                {nutritionText.sourcesLabel}
              </span>
              <p className="text-[10px] text-white/70 font-sans tracking-wide leading-relaxed normal-case">
                {language === 'fr' 
                  ? "Poulet fermier, œufs entiers, saumon, lentilles corail, skyr, tofu, bœuf haché 5%." 
                  : "Chicken breast, farm eggs, wild salmon, red lentils, Greek yogurt, tofu, 5% lean beef."}
              </p>
            </div>
          </div>

          <div className="bg-black/40 border-t-2 border-[#CCFF00] p-4 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black text-[#CCFF00]">
              <span>{nutritionText.fatsTitle}</span>
              <span className="text-white/40 font-bold">{fatsFactor} G/KG</span>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-black text-white tracking-tight">{fatsGrams}G</div>
              <div className="h-1 bg-white/5 w-full">
                <div className="h-full bg-[#CCFF00] transition-all duration-300" style={{ width: `${Math.min((fatsFactor / 1.5) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-white/5">
              <span className="text-[8px] text-white/40 font-black tracking-widest block uppercase">
                {nutritionText.sourcesLabel}
              </span>
              <p className="text-[10px] text-white/70 font-sans tracking-wide leading-relaxed normal-case">
                {language === 'fr' 
                  ? "Huile d'olive extra-vierge, avocats bien mûrs, amandes douces, graines de chia, noix." 
                  : "Extra virgin olive oil, ripe avocados, sweet almonds, chia seeds, walnuts."}
              </p>
            </div>
          </div>
        </div>

        {/* Info advice Hydration alerts */}
        <div className="border border-amber-500/20 bg-amber-500/[0.02] p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-white/70 tracking-wide leading-relaxed uppercase">
            {nutritionText.hydrationAlert}
          </p>
        </div>

      </div>
    </div>
  );
}
