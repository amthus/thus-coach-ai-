/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, TrainingPlan, ReadmeTemplate } from '../types';
import { BookOpen, Copy, Check, Loader2, Award, Zap, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface Props {
  profile: UserProfile;
  plan: TrainingPlan | null;
}

export default function ReadmeTemplateBuilder({ profile, plan }: Props) {
  const [readme, setReadme] = useState<ReadmeTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReadme = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-readme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, plan }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la génération du README.");
      }
      const data = await response.json();
      setReadme(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const getFullMarkdown = () => {
    if (!readme) return "";
    return `# 🏃‍♂️ ${readme.title}

## 📋 Présentation du Projet
Ce projet est un prototype d'assistant intelligent pour la course à pied : **Coach de Course IA**, conçu pour offrir des plannings d'entraînement adaptés et des conseils préventifs aux coureurs amateurs.

---

### ⚠️ 1. Le Problème (Problem)
${readme.problem}

---

### 💡 2. La Solution (Solution)
${readme.solution}

---

### 🧠 3. L'Approche IA (AI Approach)
${readme.aiApproach}

---

### 📈 4. L'Impact (Impact)
${readme.impact}

---

*Généré avec succès par l'application Coach de Course IA le ${new Date().toLocaleDateString('fr-FR')}*`;
  };

  const handleCopy = () => {
    const text = getFullMarkdown();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="readme-builder" className="bg-[#0F0F0F] border border-white/10 p-6 shadow-xl relative overflow-hidden">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-[#CCFF00]/10 p-2.5 rounded-none border border-[#CCFF00]/30 select-none">
            <BookOpen className="w-5 h-5 text-[#CCFF00]" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-white uppercase tracking-tighter italic">GÉNÉRATEUR DE README : PITCH DE SOUMISSION</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold mt-1">Exportez le markdown (Problème / Solution / Approche IA / Impact) pour vos dossiers</p>
          </div>
        </div>

        <button
          id="btn-generate-readme"
          onClick={generateReadme}
          disabled={loading || !plan}
          className="bg-[#CCFF00] hover:bg-white disabled:bg-white/5 disabled:text-white/20 disabled:border-transparent cursor-pointer text-black font-black uppercase tracking-widest px-5 py-3.5 rounded-none text-[10px] flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(204,255,0,0.25)] h-11"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> COMPOSITION TECHNIQUE...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> GÉNÉRER LE PITCH DE SOUMISSION
            </>
          )}
        </button>
      </div>

      {!plan && (
        <div className="bg-black/40 border border-white/10 text-center p-10 rounded-none text-white/40 font-mono">
          <HelpCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-[11px] font-black uppercase tracking-widest text-white">PLANIFICATION REQ.</p>
          <p className="text-[10px] uppercase text-white/40 mt-1.5 max-w-[360px] mx-auto leading-relaxed">
            Configurez d'abord votre programme de course via le premier onglet pour analyser la cible cardiaque et générer le pitch d'innovation.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-none p-4 text-xs text-rose-400 flex items-center gap-2.5 mb-4 font-mono uppercase">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {readme && plan && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pitch highlights */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00] font-mono">SQUELETTE DE LA DOCTRINE TECHNIQUE</h4>
            
            <div className="bg-black/40 p-4 rounded-none border border-white/10 space-y-4 font-mono">
              <div>
                <span className="text-[9px] uppercase font-black text-rose-500 tracking-widest flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> 1. LE PROBLEME REPERE (PAINPOINT)
                </span>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed uppercase">
                  {readme.problem.replace(/[#*`\-[\]]/g, "")}
                </p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <span className="text-[9px] uppercase font-black text-amber-500 tracking-widest flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> 2. L'APPROCHE IA INJECTÉE (TECH)
                </span>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed uppercase">
                  {readme.aiApproach.replace(/[#*`\-[\]]/g, "")}
                </p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <span className="text-[9px] uppercase font-black text-[#CCFF00] tracking-widest flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> 3. L'IMPACT ESTIME (METRICS)
                </span>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed uppercase">
                  {readme.impact.replace(/[#*`\-[\]]/g, "")}
                </p>
              </div>
            </div>
          </div>

          {/* Full Markdown preview area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">CODE PREVIEW (README.md)</h4>
              
              <button
                id="btn-copy-readme"
                onClick={handleCopy}
                className="bg-[#1A1A1A] hover:bg-[#CCFF00] text-white hover:text-black border border-white/10 hover:border-[#CCFF00] text-[9px] font-black uppercase tracking-widest py-2 px-3.5 rounded-none flex items-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> COPIÉ !
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> COPIER LE RAW MD
                  </>
                )}
              </button>
            </div>

            <div className="bg-black border border-white/10 p-4 rounded-none max-h-[300px] overflow-y-auto font-mono text-xs text-white/80 space-y-4">
              <span className="text-white/30 block uppercase tracking-wide">/* README.md SOURCE FILE */</span>
              <pre className="whitespace-pre-wrap select-all leading-relaxed">
                {getFullMarkdown()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
