/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, Flame, Hourglass } from 'lucide-react';
import { i18n, Language } from '../i18n';

interface RunningPaceCalcProps {
  language: Language;
}

export default function RunningPaceCalc({ language }: RunningPaceCalcProps) {
  const t = i18n[language];
  const [paceMin, setPaceMin] = useState<number>(5);
  const [paceSec, setPaceSec] = useState<number>(30);
  const [speed, setSpeed] = useState<number>(10.9);

  const handlePaceChange = (min: number, sec: number) => {
    setPaceMin(min);
    setPaceSec(sec);
    const totalMinutes = min + sec / 60;
    if (totalMinutes > 0) {
      const computedSpeed = 60 / totalMinutes;
      setSpeed(parseFloat(computedSpeed.toFixed(1)));
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (newSpeed > 0) {
      const totalMinutes = 60 / newSpeed;
      const mins = Math.floor(totalMinutes);
      const secs = Math.round((totalMinutes - mins) * 60);
      setPaceMin(mins);
      setPaceSec(secs === 60 ? 0 : secs);
    }
  };

  const presets = language === 'fr' ? [
    { name: 'Endurance de base', speed: 8.5, label: '7:03 min/km' },
    { name: 'Footing Moyen', speed: 10.0, label: '6:00 min/km' },
    { name: 'Allure Marathon', speed: 11.5, label: '5:13 min/km' },
    { name: 'Seuil Athlétique', speed: 13.0, label: '4:37 min/km' },
    { name: 'VMA / Fractionné', speed: 15.0, label: '4:00 min/km' },
  ] : [
    { name: 'Easy Run', speed: 8.5, label: '7:03 min/km' },
    { name: 'Steady Run', speed: 10.0, label: '6:00 min/km' },
    { name: 'Marathon Pace', speed: 11.5, label: '5:13 min/km' },
    { name: 'Lactate Threshold', speed: 13.0, label: '4:37 min/km' },
    { name: 'VO2 Max / Intervals', speed: 15.0, label: '4:00 min/km' },
  ];

  return (
    <div id="pace-calc" className="bg-[#0F0F0F] border border-white/10 p-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-[#CCFF00] flex items-center justify-center text-black">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest leading-none">
            {language === 'fr' ? 'CONVERTISSEUR ATHLÉTIQUE' : 'ATHLETIC CONVERTER'}
          </p>
          <h3 className="font-display font-black text-xl text-white uppercase tracking-tighter italic mt-1">
            {t.paceCalcTitle}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-black/40 p-4 border border-white/10">
          <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">
            {language === 'fr' ? 'ALLURE CIBLE (MIN / KM)' : 'TARGET PACE (MIN / KM)'}
          </label>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              min="2"
              max="15"
              value={paceMin}
              onChange={(e) => handlePaceChange(parseInt(e.target.value) || 0, paceSec)}
              className="w-16 bg-[#1A1A1A] border border-white/10 py-2 px-3 text-center text-xl font-bold font-mono text-[#CCFF00] focus:outline-none focus:border-[#CCFF00] rounded-none"
            />
            <span className="font-bold text-white/40 font-mono">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={paceSec}
              onChange={(e) => handlePaceChange(paceMin, parseInt(e.target.value) || 0)}
              className="w-16 bg-[#1A1A1A] border border-white/10 py-2 px-3 text-center text-xl font-bold font-mono text-[#CCFF00] focus:outline-none focus:border-[#CCFF00] rounded-none"
            />
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 pl-1">/ KM</span>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed font-mono uppercase">
            {language === 'fr' ? 'Durée requise pour courir 1 kilomètre.' : 'Required duration to run 1 kilometer.'}
          </p>
        </div>

        <div className="bg-black/40 p-4 border border-white/10">
          <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">
            {language === 'fr' ? 'VITESSE ÉQUIVALENTE (KM/H)' : 'EQUIVALENT SPEED (KM/H)'}
          </label>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="number"
              step="0.1"
              min="4"
              max="25"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value) || 0)}
              className="w-20 bg-[#1A1A1A] border border-white/10 py-2 px-3 text-center text-xl font-bold font-mono text-[#CCFF00] focus:outline-none focus:border-[#CCFF00] rounded-none"
            />
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50">KM/H</span>
            <input
              type="range"
              min="5"
              max="20"
              step="0.1"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="flex-1 accent-[#CCFF00] h-1 bg-white/10 cursor-pointer"
            />
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed font-mono uppercase">
            {language === 'fr' ? 'Recommandé pour configurer la vitesse sur tapis.' : 'Recommended for treadmill speed configuration.'}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-[9px] font-black uppercase tracking-widest text-[#CCFF00] mb-3 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-[#CCFF00]" /> {language === 'fr' ? 'PRESETS POUR ALLURES' : 'ALLURE PRESETS'}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.name}
              id={`preset-${preset.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => handleSpeedChange(preset.speed)}
              className="bg-[#1A1A1A] hover:bg-[#CCFF00] hover:text-black border border-white/10 hover:border-[#CCFF00] transition-all text-left p-2.5 rounded-none flex flex-col justify-between h-14"
            >
              <span className="text-[9px] font-black uppercase tracking-tight leading-tight block truncate text-inherit">
                {preset.name}
              </span>
              <span className="text-[10px] font-mono font-bold text-inherit leading-none mt-1 opacity-70">
                {preset.speed} km/h • {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
