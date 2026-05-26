/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { i18n, Language } from '../i18n';
import { Heart, Activity, ShieldAlert, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

interface PhysiologyDashboardProps {
  language: Language;
  athleteAge: number;
}

export default function PhysiologyDashboard({ language, athleteAge }: PhysiologyDashboardProps) {
  const t = i18n[language];

  const estimatedFcm = 220 - athleteAge;
  const [fcm, setFcm] = useState(estimatedFcm);
  const [fcr, setFcr] = useState(60);

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
          <ResponsiveContainer width="100%" height="100%">
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
    </div>
  );
}
