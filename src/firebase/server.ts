'use server';
import {getApps, initializeApp, cert, App} from 'firebase-admin/app';

// Helper to memoize the initialization of the Firebase Admin SDK.
// This prevents re-initializing the app on every server-side call.
let _app: App | null = null;

function getFirebaseAdminApp() {
  if (_app) {
    return _app;
  }
  const apps = getApps();
  if (apps.length > 0) {
    _app = apps[0];
    return _app;
  }

  // If no app is initialized, we're likely in a local/dev environment.
  // We'll try to use a service account key if it's available.
  // In a deployed Firebase environment (like Cloud Functions or App Hosting),
  // `initializeApp` without arguments will work automatically.
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );
    _app = initializeApp({
      credential: cert(serviceAccount),
    });
    return _app;
  } catch (e) {
    console.log('Falling back to default admin initialization.');
    // This will work in Cloud Functions and other Firebase server environments
    _app = initializeApp();
    return _app;
  }
}

export async function initFirebaseAdmin() {
  getFirebaseAdminApp();
}
