let adminDbInstance: any = null;
let adminAuthInstance: any = null;
let adminStorageInstance: any = null;

export async function getAdminServices() {
  if (adminDbInstance) {
    return { 
      adminDb: adminDbInstance, 
      adminAuth: adminAuthInstance, 
      adminStorage: adminStorageInstance 
    };
  }

  // Lazy-load firebase-admin subpath imports to avoid ESM/CommonJS compile-time evaluation issues
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');
  const { getStorage } = await import('firebase-admin/storage');

  const apps = getApps();
  let adminApp;
  if (apps.length > 0) {
    adminApp = apps[0];
  } else {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId || 'common-hero'}.appspot.com`;

    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket,
      });
    } else {
      adminApp = initializeApp({
        projectId: projectId || 'common-hero',
        storageBucket,
      });
    }
  }

  adminDbInstance = getFirestore(adminApp);
  adminAuthInstance = getAuth(adminApp);
  adminStorageInstance = getStorage(adminApp);

  return { 
    adminDb: adminDbInstance, 
    adminAuth: adminAuthInstance, 
    adminStorage: adminStorageInstance 
  };
}

export async function uploadToStorage(buffer: Buffer, mimeType: string, path: string): Promise<string> {
  const { adminStorage } = await getAdminServices();
  const bucket = adminStorage.bucket();
  const file = bucket.file(path);
  
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
    },
    resumable: false,
  });
  
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`;
}
