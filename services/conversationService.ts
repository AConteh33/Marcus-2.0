import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const CONVERSATIONS_COLLECTION = 'conversations';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  deviceId: string;
  tableNumber: number;
  language: string;
  messages: ConversationMessage[];
  startedAt: string;
  endedAt?: string | null;
}

export async function saveConversation(data: {
  deviceId: string;
  tableNumber: number;
  language: string;
  messages: ConversationMessage[];
}): Promise<string> {
  const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), {
    ...data,
    startedAt: Timestamp.now().toDate().toISOString(),
    endedAt: null
  });
  return docRef.id;
}

export async function endConversation(id: string): Promise<void> {
  const docRef = doc(db, CONVERSATIONS_COLLECTION, id);
  await updateDoc(docRef, {
    endedAt: Timestamp.now().toDate().toISOString()
  });
}

export async function appendMessage(conversationId: string, message: ConversationMessage): Promise<void> {
  const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const data = snap.data() as Conversation;
  const messages = [...(data.messages || []), message];
  await updateDoc(docRef, { messages });
}

export async function getConversationsByDevice(deviceId: string, maxResults: number = 20): Promise<Conversation[]> {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('deviceId', '==', deviceId),
    orderBy('startedAt', 'desc'),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
}

export async function getConversationsByTable(tableNumber: number): Promise<Conversation[]> {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('tableNumber', '==', tableNumber),
    orderBy('startedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
}

export async function getConversations(maxResults: number = 50): Promise<Conversation[]> {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    orderBy('startedAt', 'desc'),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(db, CONVERSATIONS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Conversation;
}
