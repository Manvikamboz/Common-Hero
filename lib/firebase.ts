import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mock-auth-domain',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock-storage-bucket',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'mock-sender-id',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'mock-app-id',
};

// Initialize Firebase client
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (typeof window !== 'undefined') {
  // Set the App Check debug token provided by the user
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = "Ae0iMNeGrb9MV0oyVzrIURiS37ObNTlRc3zHfRR06NreVC6Omks9MAQNjRkZk6C9uhKmwYulwiIKeOlamzJL6B7EO_9ByovNm4UiiVh5-q9NyKV_8O1pQxH7sJ-yJYBHNzLcu97JBdCTG-tWz4ktRTnxVQ";

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6Lcw-popAAAAAF1139487192837'),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.error("App Check failed to initialize:", err);
  }
}

export default app;
