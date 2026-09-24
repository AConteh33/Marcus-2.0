import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const CONFIG_DOC = 'config/systemPrompt';

export interface AIConfig {
  systemPrompt: string;
  updatedAt: string;
}

export async function getAIConfig(): Promise<AIConfig | null> {
  const snap = await getDoc(doc(db, CONFIG_DOC));
  if (!snap.exists()) return null;
  return snap.data() as AIConfig;
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  await setDoc(doc(db, CONFIG_DOC), config);
}

export async function getSystemPrompt(fallback: string): Promise<string> {
  const config = await getAIConfig();
  return config?.systemPrompt || fallback;
}
