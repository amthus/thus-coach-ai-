/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent startup failure if key is initially absent
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY env is empty. AI features will require entering a key or defining it in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Generate personalized training plan
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { profile, coachPersona } = req.body;
    if (!profile) {
      return res.status(400).json({ error: 'Le profil de l\'utilisateur est requis.' });
    }

    const ai = getAI();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "La clé API Gemini (GEMINI_API_KEY) est absente. Veuillez la configurer dans l'onglet Settings > Secrets." 
      });
    }

    const prompt = `Génère un plan d'entraînement de course à pied personnalisé pour l'utilisateur suivant :
- Âge: ${profile.age} ans
- Niveau: ${profile.level} (débutant/intermédiaire/avancé)
- Fréquence cible: ${profile.frequency} séances par semaine
- Distance moyenne par footing actuel: ${profile.avgDistance} km
- Objectif de course: ${profile.objective} ${profile.customObjective ? `(${profile.customObjective})` : ''}
${profile.injuryHistory ? `- Antécédents de blessures ou douleurs récentes: ${profile.injuryHistory}` : ''}

Style d'entraînement du coach :
- Nom du coach: ${coachPersona?.name || 'Coach IA'}
- Personnalité / Style: ${coachPersona?.style || 'équilibré et motivant'}
- Consignes de style: ${coachPersona?.systemPrompt || 'Donne des conseils avisés et chaleureux.'}

Génère un programme structuré sur une durée appropriée à l'objectif (propose 4 semaines d'entraînement complet pour ce prototype). Chaque semaine doit contenir exactement ${profile.frequency} séances d'entraînements de course à pied, espacées de manière logique, plus des sessions de récurrence de repos ou de renforcement si approprié.
La réponse doit être structurée strictement selon le schéma JSON fourni.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `Tu es ${coachPersona?.name || 'un coach de course à pied certifié'}. Ta mission est de générer un plan d'entraînement ultra-adapté, sécurisé et motivant au format JSON. Reste motivant et d'un professionnalisme impeccable. Fournis des descriptions courtes, précises, réalistes et en français. Explique bien le but de chaque séance (ex: endurance fondamentale à 65-70% FCM, travail de VMA, seuil anaérobie).`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objectiveLabel: {
              type: Type.STRING,
              description: "Nom ou titre court du plan (ex: Objectif premier 10km)",
            },
            levelLabel: {
              type: Type.STRING,
              description: "Niveau évalué pour l'utilisateur (ex: Débutant / Reprise progressive)",
            },
            coachTips: {
              type: Type.STRING,
              description: "Conseils du coach pour la reprise, l'équipement, l'hydratation et la gestion des douleurs.",
            },
            weeks: {
              type: Type.ARRAY,
              description: "Liste des semaines du programme",
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.INTEGER },
                  focus: { type: Type.STRING, description: "Focus principal de la semaine (ex: Augmentation progressive du volume)" },
                  sessions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        day: { type: Type.STRING, description: "Jour de la semaine (Lundi, Mardi, etc.)" },
                        type: {
                          type: Type.STRING,
                          description: "Valeurs acceptées : endurance, fractionne, seuil, longue, repos",
                        },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING, description: "Contenu de la séance avec allures cibles." },
                        durationMinutes: { type: Type.INTEGER },
                        distanceKm: { type: Type.NUMBER, description: "Distance préconisée (optionnel)" },
                        intensityPercent: { type: Type.INTEGER, description: "Pourcentage d'effort ressenti ou fréquence cardiaque estimée de 0 à 100" },
                        warmup: { type: Type.STRING, description: "Échauffement conseillé (ex: 10 min de footing lent + gammes)" },
                        cooldown: { type: Type.STRING, description: "Récupération/étirements conseillés" },
                      },
                      required: ["id", "day", "type", "title", "description", "durationMinutes", "intensityPercent"],
                    },
                  },
                },
                required: ["weekNumber", "focus", "sessions"],
              },
            },
          },
          required: ["objectiveLabel", "levelLabel", "coachTips", "weeks"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      return res.status(500).json({ error: "Aucun contenu n'a été retourné par le modèle AI." });
    }

    const plan = JSON.parse(jsonText.trim());
    res.json(plan);
  } catch (error: any) {
    console.error('Error generating running plan:', error);
    res.status(500).json({ error: error.message || "Erreur interne lors de la génération du plan." });
  }
});

// 2. API: Chat interaction with AI Coach
app.post('/api/chat-coach', async (req, res) => {
  try {
    const { messages, profile, coachPersona } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "L'historique des messages est requis." });
    }

    const ai = getAI();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "La clé API Gemini (GEMINI_API_KEY) est absente. Veuillez la configurer dans l'onglet Settings > Secrets." 
      });
    }

    // Build the chat session
    const lastMessage = messages[messages.length - 1];
    const systemPrompt = `Tu es ${coachPersona?.name || 'un coach sportif de course à pied'}.
Style de coaching: ${coachPersona?.style || 'équilibré'}.
Description du comportement : ${coachPersona?.systemPrompt || 'Encouragement et conseils techniques basés de manière réaliste.'}

L'utilisateur se prépare pour un objectif de ${profile?.objective || 'course à pied générale'} avec un niveau ${profile?.level || 'non défini'} (${profile?.frequency || 3} fois par semaine, footing moyen de ${profile?.avgDistance || 5} km).
${profile?.injuryHistory ? `IMPORTANT : L'utilisateur signale des antécédents de : "${profile.injuryHistory}". Reste extrêmement prudent et conseille des ajustements si besoin (ostéopathe, repos, diminution du volume).` : ''}

Réponds avec empathie, technicité sportive, et reste dans le ton de ta personnalité d'entraîneur. Tes réponses doivent être concises, structurées et utiles. Écris toujours en français.`;

    const chatHistory = messages.slice(0, -1).map((msg: any) => {
      return {
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: lastMessage.text }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: error.message || "Erreur lors du traitement de votre message par le coach." });
  }
});

// 3. API: Generate complete Github Portfolio README
app.post('/api/generate-readme', async (req, res) => {
  try {
    const { profile, plan } = req.body;
    
    const ai = getAI();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "La clé API Gemini (GEMINI_API_KEY) est absente. Veuillez la configurer dans l'onglet Settings > Secrets." 
      });
    }

    const prompt = `Génère un README GitHub de projet absolument exceptionnel et structuré en français pour présenter cette application d'entraînement de course à pied IA (nommée "Coach de Course IA" ou autre titre personnalisé). 
L'utilisateur s'entraîne avec le profil suivant :
- Âge: ${profile?.age || 30} ans
- Objectif complet: ${profile?.objective || 'course à pied'}
- Niveau de départ: ${profile?.level || 'débutant'}
- Plan d'entraînement personnalisé généré: ${plan?.objectiveLabel || 'Plan de course'}

Rédige le markdown du README en respectant scrupuleusement la structure demandée par les challenges de prototypage rapide :
1. **Le Problème** : les coureurs amateurs manquent de guidance adaptée, courent trop vite lors de l'endurance fondamentale entraînant fatigue, blessures, et abandon rapide. Une séance mal structurée annule la progression.
2. **La Solution** : "Coach de Course IA" qui conçoit instantanément des séances variées par rapport au rythme cardiaque théorique et antécédents.
3. **L'Approche IA** : Utilisation du modèle de fondation Google Gemini (gemini-3.5-flash) couplé à une schématisation stricte (JSON-schema) pour transformer un profil de coureur amateur en un calendrier d'entraînement hebdomadaire équilibré et dynamique sans erreurs de syntaxe.
4. **L'Impact** : Démocratisation de l'accès à de la science de l'entraînement, réduction du taux d'abandon, prévention active des blessures grâce aux contraintes médicales prises en compte par le modèle.

Inclus un petit tableau d'exemple de programme basé sur le plan généré.
Retourne la réponse au format JSON selon le schéma suivant :
{
  "title": "Titre accrocheur du projet",
  "problem": "Explication détaillée de la section problème (format markdown)",
  "solution": "Explication détaillée de la section solution (format markdown)",
  "aiApproach": "Explication détaillée de l'approche AI (format markdown)",
  "impact": "Explication détaillée de l'impact social/physique (format markdown)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            problem: { type: Type.STRING },
            solution: { type: Type.STRING },
            aiApproach: { type: Type.STRING },
            impact: { type: Type.STRING },
          },
          required: ["title", "problem", "solution", "aiApproach", "impact"],
        }
      }
    });

    const jsonText = response.text;
    res.json(JSON.parse(jsonText.trim()));
  } catch (error: any) {
    console.error('Error generating README:', error);
    res.status(500).json({ error: error.message || "Erreur lors de la génération du modèle de README." });
  }
});


// 4. Connect Vite Frontend middleware or serve production assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production assets from:", distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Dev Server successfully running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
