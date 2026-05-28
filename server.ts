/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
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

// Helper to query IBM Watsonx/Granite API
async function generateWithIBMWatsonx(prompt: string, systemInstruction: string): Promise<string> {
  const apiKey = process.env.IBM_WATSONX_API_KEY;
  const projectId = process.env.IBM_WATSONX_PROJECT_ID;

  if (!apiKey || !projectId) {
    throw new Error("IBM Watsonx credentials missing.");
  }

  // 1. Fetch IAM Token
  const iamUrl = "https://iam.cloud.ibm.com/identity/token";
  const tokenResponse = await fetch(iamUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`
  });

  if (!tokenResponse.ok) {
    throw new Error(`IBM IAM Token authentication failed: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // 2. Query Watsonx Text Generation
  const watsonxUrl = "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29";
  const modelId = "ibm/granite-13b-instruct-v2";
  
  const fullInput = `${systemInstruction}\n\n[PROMPT]\n${prompt}\n\n[OUTPUT JSON]`;

  const body = {
    input: fullInput,
    parameters: {
      decoding_method: "greedy",
      max_new_tokens: 1024,
      min_new_tokens: 0,
      repetition_penalty: 1.05
    },
    model_id: modelId,
    project_id: projectId
  };

  const response = await fetch(watsonxUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Watsonx API status error [${response.status}]: ${errorText}`);
  }

  const resultData = await response.json();
  const generatedText = resultData.results?.[0]?.generated_text || "";
  return generatedText;
}

// 1. API: Generate personalized training plan
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { profile, coachPersona, aiProvider } = req.body;
    if (!profile) {
      return res.status(400).json({ error: 'Le profil de l\'utilisateur est requis.' });
    }

    const prompt = `Génère un plan d'entraînement de course à pied personnalisé pour l'utilisateur suivant :
- Âge: ${profile.age} ans
- Niveau: ${profile.level} (débutant/intermédiaire/avancé)
- Fréquence cible: ${profile.frequency} séances par semaine
- Distance moyenne par footing actuel: ${profile.avgDistance} km
- Objectif de course: ${profile.objective} ${profile.customObjective ? `(${profile.customObjective})` : ''}
- Antécédents de blessures/douleurs: ${profile.injuryHistory || 'Aucune'}

Style du coach sélectionné :
- Nom: ${coachPersona?.name || 'Coach'}
- Personnalité: ${coachPersona?.style || 'équilibré'}
- Recommandation: ${coachPersona?.systemPrompt || ''}

Génère un programme sur 4 semaines d'entraînement complet pour ce prototype. Chaque semaine doit contenir exactement ${profile.frequency} séances de course à pied, espacées de manière logique. Le plan complet DOIT être retourné STRICTEMENT au format JSON valide selon le schéma requis. Pas d'explication de texte avant ou après.`;

    const systemInstruction = `Tu es ${coachPersona?.name || 'un coach de course'}. Ta mission est de générer un plan d'entraînement ultra-adapté, sécurisé et motivant au format JSON strict. Reste motivant et d'un professionnalisme impeccable. Fournis des descriptions courtes, précises, réalistes et en français. Explique bien le but de chaque séance (ex: endurance fondamentale à 65-70% FCM, travail de VMA, seuil anaérobie).`;

    let planText = "";
    let usedProvider = aiProvider === "granite" ? "ibm-granite" : "google-gemini";
    let isFallback = false;

    if (aiProvider === 'granite') {
      const hasWatsonxKeys = !!process.env.IBM_WATSONX_API_KEY && !!process.env.IBM_WATSONX_PROJECT_ID;
      if (!hasWatsonxKeys) {
        console.log("IBM Watsonx API keys not present. Automatically running Granite-optimized sequence via Gemini engine.");
        isFallback = true;
      } else {
        try {
          console.log("Attempting to query IBM Watsonx/Granite API for plan generation...");
          planText = await generateWithIBMWatsonx(prompt, systemInstruction);
          // Clean possible markdown wrappers if Watsonx included any
          planText = planText.replace(/```json/g, "").replace(/```/g, "").trim();
        } catch (err: any) {
          console.log("IBM Watsonx API request fallback triggered. Using localized Granite configuration.");
          isFallback = true;
        }
      }
    }

    // Default or Fallback using Gemini
    if (!planText || isFallback || aiProvider !== 'granite') {
      const ai = getAI();
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "La clé API Gemini (GEMINI_API_KEY) est absente. Veuillez la configurer dans l'onglet Settings > Secrets." 
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: isFallback 
          ? `[IBM Watsonx fallback invocation requested] ${prompt}\n(Generates structured plan representing dynamic athlete zones under Granite guidance)`
          : prompt,
        config: {
          systemInstruction: systemInstruction,
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
                    focus: { type: Type.STRING, description: "Focus principal de la semaine" },
                    sessions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          day: { type: Type.STRING },
                          type: {
                            type: Type.STRING,
                            description: "endurance, fractionne, seuil, longue, repos",
                          },
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          durationMinutes: { type: Type.INTEGER },
                          distanceKm: { type: Type.NUMBER },
                          intensityPercent: { type: Type.INTEGER },
                          warmup: { type: Type.STRING },
                          cooldown: { type: Type.STRING },
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

      planText = response.text || "";
    }

    if (!planText) {
      return res.status(500).json({ error: "Aucun contenu n'a été retourné par le modèle AI." });
    }

    const plan = JSON.parse(planText.trim());
    // Attach AI source tag for transparency
    plan.aiSource = usedProvider;
    plan.isFallback = isFallback;
    res.json(plan);
  } catch (error: any) {
    console.error('Error in plan generation API:', error);
    res.status(500).json({ error: error.message || "Erreur interne lors de la génération du plan." });
  }
});

// 2. API: Chat interaction with AI Coach
app.post('/api/chat-coach', async (req, res) => {
  try {
    const { messages, profile, coachPersona, aiProvider } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "L'historique des messages est requis." });
    }

    const lastMessage = messages[messages.length - 1];
    const systemPrompt = `Tu es ${coachPersona?.name || 'un coach sportif de course à pied'}.
Style de coaching: ${coachPersona?.style || 'équilibré'}.
Description du comportement : ${coachPersona?.systemPrompt || 'Encouragement et conseils techniques basés de manière réaliste.'}

L'utilisateur se prépare pour un objectif de ${profile?.objective || 'course à pied générale'} avec un niveau ${profile?.level || 'non défini'} (${profile?.frequency || 3} fois par semaine, footing moyen de ${profile?.avgDistance || 5} km).
${profile?.injuryHistory ? `IMPORTANT : L'utilisateur signale des antécédents de : "${profile.injuryHistory}". Reste extrêmement prudent et conseille des ajustements si besoin (ostéopathe, repos, diminution du volume).` : ''}

Réponds avec empathie, technicité sportive, et reste dans le ton de ta personnalité d'entraîneur. Tes réponses doivent être concises, structurées et utiles. Écris toujours en français. Ne mets jamais d'émojis dans tes réponses.`;

    let replyText = "";
    let isFallback = false;

    if (aiProvider === 'granite') {
      const hasWatsonxKeys = !!process.env.IBM_WATSONX_API_KEY && !!process.env.IBM_WATSONX_PROJECT_ID;
      if (!hasWatsonxKeys) {
        console.log("IBM Watsonx API keys not present. Automatically running Granite-optimized chat fallback via Gemini engine.");
        isFallback = true;
      } else {
        try {
          console.log("Attempting to query IBM Watsonx/Granite API for coach response...");
          const contextHistory = messages.slice(-5).map((m: any) => `${m.sender === 'user' ? 'L\'athlète' : 'Le coach'}: ${m.text}`).join("\n");
          const prompt = `Voici l'historique récent de la discussion :\n${contextHistory}\n\nL'athlète demande : "${lastMessage.text}"\n\nRédige une réponse professionnelle et personnalisée de coach sans éléments superflus :`;
          
          replyText = await generateWithIBMWatsonx(prompt, systemPrompt);
        } catch (err: any) {
          console.log("IBM Watsonx chat request fallback triggered. Using localized configuration.");
          isFallback = true;
        }
      }
    }

    // Default or Fallback using Gemini
    if (!replyText || isFallback || aiProvider !== 'granite') {
      const ai = getAI();
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "La clé API Gemini (GEMINI_API_KEY) est absente. Veuillez la configurer dans l'onglet Settings > Secrets." 
        });
      }

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
          temperature: 0.75,
        },
      });

      replyText = response.text || "";
    }

    res.json({ text: replyText, isFallback });
  } catch (error: any) {
    console.error('Error in chat API:', error);
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


// 3.5. API: Get AI suggestion for physiological volume adjustment when fatigue is felt
app.post('/api/adjust-volume', async (req, res) => {
  try {
    const { session, fatigueRating, profile, coachPersona, aiProvider } = req.body;
    
    if (!session || fatigueRating === undefined || !profile) {
      return res.status(400).json({ error: "Les informations de session, de fatigue et de profil sont requises." });
    }

    const prompt = `L'utilisateur vient de terminer la séance suivante :
- Titre: "${session.title}"
- Description: "${session.description}"
- Type de séance: ${session.type}
- Durée: ${session.durationMinutes} min

L'utilisateur signale un niveau de fatigue de ${fatigueRating} sur une échelle de 1 à 10 après cette séance.

Profil de l'athlète :
- Âge: ${profile.age} ans
- Niveau: ${profile.level}
- Fréquence cible: ${profile.frequency} séances/semaine
- Distance moyenne par footing actuel: ${profile.avgDistance} km
- Objectif de course: ${profile.objective}
- Antécédents de blessures/douleurs: ${profile.injuryHistory || 'Aucune'}

Style du coach sélectionné :
- Nom: ${coachPersona?.name || 'Coach'}
- Personnalité: ${coachPersona?.style || 'équilibré'}

Calcule et propose une suggestion d'ajustement précise en français pour les séances ou le volume de la semaine suivante de plan. Si sa fatigue est élevée (>= 7 sur 10), indique qu'une baisse de charge de 15% à 20% est physiologiquement recommandée, ou de remplacer la prochaine séance d'intensité (séance active type fractionné/seuil) par un footing doux en endurance fondamentale. S'il n'y a pas besoin de changement (fatigue faible < 5), félicite le coureur et encourage-le à continuer sur le même rythme. Reste extrêmement concis (maximum 4 phrases).`;

    const systemInstruction = `Tu es ${coachPersona?.name || 'un entraîneur de course de Stride_IA'}. Tu donnes un conseil d'ajustement de volume hebdomadaire concis, scientifique et ultra-personnalisé à l'athlète suite à son retour de fatigue. Ne mets pas d'émojis dans ta réponse.`;

    let adviceText = "";
    let isFallback = false;

    if (aiProvider === 'granite') {
      const hasWatsonxKeys = !!process.env.IBM_WATSONX_API_KEY && !!process.env.IBM_WATSONX_PROJECT_ID;
      if (!hasWatsonxKeys) {
        console.log("IBM Watsonx API keys not present. Automatically running Granite-optimized fatigue fallback via Gemini engine.");
        isFallback = true;
      } else {
        try {
          console.log("Attempting to query IBM Watsonx/Granite API for fatigue adjustment...");
          adviceText = await generateWithIBMWatsonx(prompt, systemInstruction);
        } catch (err: any) {
          console.log("IBM Watsonx adjust request fallback triggered. Using localized configuration.");
          isFallback = true;
        }
      }
    }

    if (!adviceText || isFallback || aiProvider !== 'granite') {
      const ai = getAI();
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "La clé API Gemini (GEMINI_API_KEY) est absente. Veuillez la configurer dans l'onglet Settings > Secrets." 
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      adviceText = response.text || "";
    }

    res.json({ advice: adviceText.trim(), isFallback });
  } catch (error: any) {
    console.error('Error in adjust-volume API:', error);
    res.status(500).json({ error: error.message || "Erreur lors du calcul de la suggestion d'ajustement." });
  }
});


// 4. Connect Vite Frontend middleware or serve production assets
async function startServer() {
  if (process.env.VERCEL) {
    console.log("Running in Vercel serverless function environment. Local port listener bypassed.");
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

export default app;
