import type { Transcript } from '../types';

const HISTORY_KEY = 'marcus_conversation_history';
const LEARNED_KEY = 'marcus_learned_context';
const MAX_HISTORY = 40;
const MAX_CONTEXT_TURNS = 20;
const MAX_LEARNED_FACTS = 25;

export interface LearnedFact {
  text: string;
  updatedAt: number;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.warn(`Failed to persist ${key}:`, e);
  }
}

export function loadConversationHistory(): Transcript[] {
  return readJson<Transcript[]>(HISTORY_KEY, []);
}

export function saveConversationHistory(history: Transcript[]): void {
  const trimmed = history.slice(-MAX_HISTORY);
  writeJson(HISTORY_KEY, trimmed);
}

export function clearConversationHistory(): void {
  try {
    sessionStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

export function loadLearnedFacts(): LearnedFact[] {
  return readJson<LearnedFact[]>(LEARNED_KEY, []);
}

export function saveLearnedFacts(facts: LearnedFact[]): void {
  writeJson(LEARNED_KEY, facts.slice(-MAX_LEARNED_FACTS));
}

export function clearLearnedFacts(): void {
  try {
    sessionStorage.removeItem(LEARNED_KEY);
    localStorage.removeItem(LEARNED_KEY);
  } catch {
    // ignore
  }
}

/** Heuristic extraction of durable preferences / goals from a user utterance. */
export function extractLearnableFacts(userText: string): string[] {
  const text = userText.trim();
  if (!text || text.length < 8) return [];

  const facts: string[] = [];
  const lower = text.toLowerCase();

  const preferencePatterns = [
    /\b(?:i(?:'m| am)|call me|my name is)\s+([a-z][a-z\s'-]{1,40})/i,
    /\b(?:i prefer|please always|from now on|remember that|don't forget|note that)\b[\s:]+(.{8,120})/i,
    /\b(?:i(?:'m| am) working on|my project is|we(?:'re| are) building)\b[\s:]+(.{8,120})/i,
    /\b(?:my (?:email|phone|company|role|job) is)\b[\s:]+(.{3,80})/i,
    /\b(?:use|speak|talk in)\s+(english|arabic|french|spanish|krio)\b/i,
  ];

  for (const pattern of preferencePatterns) {
    const match = text.match(pattern);
    if (match) {
      facts.push(match[0].replace(/\s+/g, ' ').trim());
    }
  }

  // Ongoing task / goal cues
  if (/\b(?:need to|have to|trying to|want to|goal is|next i|tomorrow|later)\b/i.test(lower) && text.length < 180) {
    facts.push(`Ongoing intent: ${text}`);
  }

  return facts;
}

export function mergeLearnedFacts(existing: LearnedFact[], newTexts: string[]): LearnedFact[] {
  const now = Date.now();
  const map = new Map<string, LearnedFact>();

  for (const fact of existing) {
    map.set(fact.text.toLowerCase(), fact);
  }
  for (const text of newTexts) {
    const key = text.toLowerCase();
    map.set(key, { text, updatedAt: now });
  }

  return Array.from(map.values())
    .sort((a, b) => a.updatedAt - b.updatedAt)
    .slice(-MAX_LEARNED_FACTS);
}

export function buildConversationMemoryBlock(history: Transcript[], facts: LearnedFact[]): string {
  const parts: string[] = [];

  if (facts.length > 0) {
    parts.push(
      '\n\n## LEARNED USER CONTEXT (from earlier conversations — use this, do not re-ask)\n' +
        facts.map((f, i) => `${i + 1}. ${f.text}`).join('\n')
    );
  }

  const recent = history.slice(-MAX_CONTEXT_TURNS);
  if (recent.length > 0) {
    parts.push(
      '\n\n## RECENT CONVERSATION HISTORY (learn from this; continue threads; anticipate next needs)\n' +
        recent.map((t) => `${t.speaker === 'user' ? 'USER' : 'AI'}: ${t.text}`).join('\n') +
        '\n\nUse the history above to: avoid repeating questions, continue unfinished tasks, recall preferences, and think one step ahead about what the user will need next.'
    );
  }

  return parts.join('');
}
