import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { MenuItem } from '../data/menuData';

const MENU_COLLECTION = 'menuItems';

export interface FirestoreMenuItem extends MenuItem {
  order?: number;
}

export async function getMenuItems(): Promise<FirestoreMenuItem[]> {
  const q = query(collection(db, MENU_COLLECTION), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreMenuItem));
}

export async function getMenuItem(id: string): Promise<FirestoreMenuItem | null> {
  const snap = await getDoc(doc(db, MENU_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FirestoreMenuItem;
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>, order: number = 0): Promise<string> {
  const docRef = await addDoc(collection(db, MENU_COLLECTION), { ...item, order });
  return docRef.id;
}

export async function updateMenuItem(id: string, updates: Partial<FirestoreMenuItem>): Promise<void> {
  const docRef = doc(db, MENU_COLLECTION, id);
  await updateDoc(docRef, updates);
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(db, MENU_COLLECTION, id));
}

export async function reorderMenuItems(items: { id: string; order: number }[]): Promise<void> {
  const batch = writeBatch(db);
  items.forEach(item => {
    batch.update(doc(db, MENU_COLLECTION, item.id), { order: item.order });
  });
  await batch.commit();
}

export async function seedMenuItems(fallbackItems: FirestoreMenuItem[]): Promise<void> {
  const existing = await getMenuItems();
  if (existing.length > 0) return;
  const batch = writeBatch(db);
  fallbackItems.forEach((item, i) => {
    const docRef = doc(collection(db, MENU_COLLECTION));
    batch.set(docRef, { ...item, order: i });
  });
  await batch.commit();
}
