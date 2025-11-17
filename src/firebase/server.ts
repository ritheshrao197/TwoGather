'use server';
import {getApps, initializeApp, cert, App} from 'firebase-admin/app';

// Helper to memoize the initialization of the Firebase Admin SDK.
// This prevents re-initializing the app on every server-side call.
let _app: App | null = null;

function getFirebaseAdminApp() {
  // In development mode, bypass Firebase Admin SDK entirely
  if (process.env.NODE_ENV === 'development') {
    console.log('Bypassing Firebase Admin SDK in development mode');
    return null;
  }
  
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
    // Check if we have a service account key environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
      );
      _app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // If we have a project ID, initialize with it
      _app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      console.log('No service account key or project ID found, falling back to default admin initialization.');
      // This will work in Cloud Functions and other Firebase server environments
      _app = initializeApp();
    }
    return _app;
  } catch (e: any) {
    console.log('Falling back to default admin initialization due to error:', e.message);
    try {
      // This will work in Cloud Functions and other Firebase server environments
      _app = initializeApp();
      return _app;
    } catch (initError: any) {
      console.error('Failed to initialize Firebase Admin:', initError.message);
      // In development, we might not have Firebase Admin properly configured
      // Return null to indicate that Firebase Admin is not available
      return null;
    }
  }
}

export async function initFirebaseAdmin() {
  try {
    const app = getFirebaseAdminApp();
    if (!app && process.env.NODE_ENV !== 'development') {
      throw new Error('Firebase Admin SDK is not available in this environment');
    }
    return app;
  } catch (error: any) {
    console.error('Error initializing Firebase Admin:', error.message);
    // Return null to indicate that Firebase Admin is not available
    return null;
  }
}