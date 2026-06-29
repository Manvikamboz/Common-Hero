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
  // Set the App Check debug token only if explicitly provided or in development mode
  const isDebug = !!(process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN || process.env.NODE_ENV === 'development');
  if (process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKENS = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
  } else if (process.env.NODE_ENV === 'development') {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKENS = true;
  }

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const hasRealSiteKey = siteKey && siteKey !== '6Lcw-popAAAAAF1139487192837';

  if (hasRealSiteKey || isDebug) {
    try {
      const activeSiteKey = siteKey || '6Lcw-popAAAAAF1139487192837';
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(activeSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log("App Check initialized successfully.");
    } catch (err) {
      console.error("App Check failed to initialize:", err);
    }
  } else {
    console.warn("App Check skipped: No valid NEXT_PUBLIC_RECAPTCHA_SITE_KEY found in production.");
  }
}

export default app;
