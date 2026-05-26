/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CoachPersona, UserProfile } from '../types';
import { Send, User, Sparkles } from 'lucide-react';
import { i18n, Language } from '../i18n';

interface Props {
  profile: UserProfile;
  activeCoach: CoachPersona;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  loading: boolean;
  language: Language;
}

export default function CoachChat({ profile, activeCoach, messages, onSendMessage, loading, language }: Props) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = i18n[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickReplies = language === 'fr' ? [
    { label: "Douleur musculaire, que faire ?", value: "J'ai ressenti une petite gêne musculaire à la jambe lors de ma dernière course. Quels ajustements conseilles-tu ?" },
    { label: "Comment travailler ma respiration ?", value: "Quels sont tes conseils pour ajuster ma respiration en course à pied, particulièrement sur l'endurance fondamentale ?" },
    { label: "Que manger avant de courir ?", value: "Que recommandes-tu de manger avant d'entamer une séance de course, et combien de temps avant ?" },
    { label: "J'ai manqué un entraînement !", value: "J'ai raté ma dernière séance d'entraînement. Comment puis-je l'ajuster ou la rattraper ?" },
  ] : [
    { label: "Sore muscles, what to do?", value: "I felt some muscle soreness/stiffness in my legs during my last run. What adjustments do you recommend?" },
    { label: "How to improve my breathing?", value: "What are your tips for adjusting my breathing during runs, especially for low HR aerobic base runs?" },
    { label: "What to eat before running?", value: "What do you recommend to eat or drink before starting a running session, and how long before?" },
    { label: "I missed a workout session!", value: "I missed my last scheduled training session. Should I try to catch up or skip it?" },
  ];

  return (
    <div id="coach-chat" className="bg-[#0F0F0F] border border-white/10 flex flex-col h-[520px] shadow-xl overflow-hidden relative">
      <div className="bg-[#151515] px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-[#1A1A1A] border border-white/10 flex items-center justify-center font-mono font-black text-xs text-[#CCFF00]">
              {activeCoach.avatar}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#CCFF00] border border-black rounded-none" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">{activeCoach.name}</h3>
              <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
            </div>
            <p className="text-[10px] text-white/40 font-mono mt-0.5 uppercase tracking-wider">{activeCoach.description}</p>
          </div>
        </div>

        <span className="text-[9px] font-black uppercase tracking-wider text-[#CCFF00] px-2 py-0.5 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-none">
          {activeCoach.style}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`p-2 rounded-none shrink-0 h-9 w-9 flex items-center justify-center font-bold border ${
                isUser 
                  ? 'bg-[#1A1A1A] border-white/15 text-white' 
                  : 'bg-[#CCFF00]/10 border-[#CCFF00]/25 text-[#CCFF00]'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <span className="font-mono text-xs">{activeCoach.avatar}</span>}
              </div>

              <div className={`relative px-4 py-3 rounded-none text-white text-sm whitespace-pre-line leading-relaxed ${
                isUser 
                  ? 'bg-[#CCFF00] text-black font-semibold' 
                  : 'bg-[#151515] border border-white/10'
              }`}>
                {msg.text}
                <span className={`block text-[8px] mt-1.5 text-right font-mono uppercase ${isUser ? 'text-black/60 font-bold' : 'text-white/30'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 p-2 rounded-none shrink-0 h-9 w-9 flex items-center justify-center font-mono font-black text-xs text-[#CCFF00]">
              {activeCoach.avatar}
            </div>
            <div className="bg-[#151515] border border-white/10 px-4 py-3.5 rounded-none flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#CCFF00] rounded-none animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-[#CCFF00] rounded-none animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-[#CCFF00] rounded-none animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {messages.length < 3 && !loading && (
        <div className="px-5 py-2.5 bg-black/40 border-t border-white/10 overflow-x-auto flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40 font-mono shrink-0">Suggestions:</span>
          {quickReplies.map((qr) => (
            <button
              key={qr.label}
              id={`quick-reply-${qr.label.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => onSendMessage(qr.value)}
              className="bg-[#1A1A1A] border border-white/10 text-[9px] text-white/70 hover:text-black hover:bg-[#CCFF00] hover:border-[#CCFF00] rounded-none py-1.5 px-3.5 whitespace-nowrap transition-all uppercase font-black tracking-wider"
            >
              {qr.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 bg-black flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.coachChatPlaceholder}
          disabled={loading}
          className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-none px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#CCFF00] disabled:opacity-50 font-bold"
        />
        <button
          type="submit"
          id="send-chat-message"
          disabled={loading || !inputText.trim()}
          className="bg-[#CCFF00] hover:bg-white disabled:bg-white/5 disabled:text-white/20 transition-all text-black p-2.5 rounded-none flex items-center justify-center font-bold"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
