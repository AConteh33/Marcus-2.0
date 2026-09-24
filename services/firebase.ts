import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAp0axRTw8EwvCMdpNF-yD0XLZLrUH48dM",
  authDomain: "mother-app-9ca4d.firebaseapp.com",
  projectId: "mother-app-9ca4d",
  storageBucket: "mother-app-9ca4d.firebasestorage.app",
  messagingSenderId: "1053015888267",
  appId: "1:1053015888267:web:example"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
