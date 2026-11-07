/**
 * AI gateway. Every call returns the provider that actually produced the content,
 * so the UI never claims a model that was not used.
 *
 * Order of resolution: requested provider → the other configured provider → caller's
 * deterministic fallback (rules engine).
 */
import { GoogleGenAI, Type } from '@google/genai';
import type { AppConfig } from '../config';
import type { AiProvider } from '../../shared/types';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface AiResult<T> {
  value: T;
  provider: AiProvider;
}

const TIMEOUT_MS = 45_000;

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`AI request timed out after ${ms} ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export const PLAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    objectiveLabel: { type: Type.STRING },
    levelLabel: { type: Type.STRING },
    coachTips: { type: Type.STRING },
    weeks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          weekNumber: { type: Type.INTEGER },
          focus: { type: Type.STRING },
          sessions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                day: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['endurance', 'fractionne', 'seuil', 'longue', 'repos'] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                durationMinutes: { type: Type.INTEGER },
                distanceKm: { type: Type.NUMBER },
                intensityPercent: { type: Type.INTEGER },
                warmup: { type: Type.STRING },
                cooldown: { type: Type.STRING },
              },
              required: ['id', 'day', 'type', 'title', 'description', 'durationMinutes', 'intensityPercent'],
            },
          },
        },
        required: ['weekNumber', 'focus', 'sessions'],
      },
    },
  },
  required: ['objectiveLabel', 'levelLabel', 'coachTips', 'weeks'],
};

export class AiGateway {
  private gemini: GoogleGenAI | null = null;
  private watsonxToken: { value: string; expiresAt: number } | null = null;

  constructor(private config: AppConfig) {}

  get geminiEnabled() {
    return Boolean(this.config.GEMINI_API_KEY);
  }
  get graniteEnabled() {
    return Boolean(this.config.IBM_WATSONX_API_KEY && this.config.IBM_WATSONX_PROJECT_ID);
  }
  get anyEnabled() {
    return this.geminiEnabled || this.graniteEnabled;
  }

  /** Providers to try, in order, for a requested provider. */
  private order(requested: AiProvider): AiProvider[] {
    const all: AiProvider[] = requested === 'granite' ? ['granite', 'gemini'] : ['gemini', 'granite'];
    return all.filter((p) => (p === 'gemini' ? this.geminiEnabled : this.graniteEnabled));
  }

  private getGemini(): GoogleGenAI {
    this.gemini ??= new GoogleGenAI({ apiKey: this.config.GEMINI_API_KEY! });
    return this.gemini;
  }

  private async getWatsonxToken(): Promise<string> {
    if (this.watsonxToken && this.watsonxToken.expiresAt > Date.now() + 60_000) return this.watsonxToken.value;
    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: this.config.IBM_WATSONX_API_KEY!,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`IBM IAM authentication failed (${res.status})`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.watsonxToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  }

  private async watsonxGenerate(system: string, prompt: string, maxTokens: number): Promise<string> {
    const token = await this.getWatsonxToken();
    const res = await fetch(`${this.config.IBM_WATSONX_URL}/ml/v1/text/generation?version=2024-05-01`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        input: `<|system|>\n${system}\n<|user|>\n${prompt}\n<|assistant|>\n`,
        parameters: { decoding_method: 'greedy', max_new_tokens: maxTokens, repetition_penalty: 1.05 },
        model_id: this.config.IBM_WATSONX_MODEL,
        project_id: this.config.IBM_WATSONX_PROJECT_ID,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Watsonx error (${res.status})`);
    const data = (await res.json()) as { results?: { generated_text?: string }[] };
    return (data.results?.[0]?.generated_text ?? '').trim();
  }

  /** Generates JSON. Returns null when no provider is available or all failed. */
  async generateJson(requested: AiProvider, system: string, prompt: string): Promise<AiResult<unknown> | null> {
    for (const provider of this.order(requested)) {
      try {
        let text: string;
        if (provider === 'gemini') {
          const r = await withTimeout(
            this.getGemini().models.generateContent({
              model: this.config.GEMINI_MODEL,
              contents: prompt,
              config: {
                systemInstruction: system,
                responseMimeType: 'application/json',
                responseSchema: PLAN_RESPONSE_SCHEMA,
                temperature: 0.6,
              },
            }),
          );
          text = r.text ?? '';
        } else {
          text = await this.watsonxGenerate(`${system}\nRéponds uniquement avec du JSON valide, sans texte autour.`, prompt, 4000);
        }
        const json = extractJson(text);
        if (json !== null) return { value: json, provider };
      } catch (err) {
        console.warn(`[ai] ${provider} JSON generation failed:`, (err as Error).message);
      }
    }
    return null;
  }

  /** Generates plain text (chat, advice). Returns null when no provider is available or all failed. */
  async generateText(
    requested: AiProvider,
    system: string,
    history: ChatTurn[],
    opts: { temperature?: number; maxTokens?: number } = {},
  ): Promise<AiResult<string> | null> {
    for (const provider of this.order(requested)) {
      try {
        let text: string;
        if (provider === 'gemini') {
          const r = await withTimeout(
            this.getGemini().models.generateContent({
              model: this.config.GEMINI_MODEL,
              contents: history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
              config: { systemInstruction: system, temperature: opts.temperature ?? 0.7, maxOutputTokens: opts.maxTokens ?? 1024 },
            }),
          );
          text = r.text ?? '';
        } else {
          const transcript = history
            .map((t) => `${t.role === 'user' ? 'Athlète' : 'Coach'} : ${t.text}`)
            .join('\n');
          text = await this.watsonxGenerate(system, transcript, opts.maxTokens ?? 700);
        }
        text = text.trim();
        if (text) return { value: text, provider };
      } catch (err) {
        console.warn(`[ai] ${provider} text generation failed:`, (err as Error).message);
      }
    }
    return null;
  }
}

export function extractJson(text: string): unknown | null {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Strips characters that could be used to break out of prompt delimiters. */
export function sanitizeForPrompt(value: string | null | undefined, max = 300): string {
  return (value ?? '')
    .replace(/[\u0000-\u001f`<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
