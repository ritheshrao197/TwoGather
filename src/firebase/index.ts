'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      console.log('Attempting to initialize Firebase with automatic configuration...');
      firebaseApp = initializeApp();
      console.log('Firebase initialized successfully with automatic configuration');
    } catch (e) {
      console.log('Automatic Firebase initialization failed:', e);
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      try {
        console.log('Falling back to manual Firebase configuration...');
        firebaseApp = initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully with manual configuration');
      } catch (initError) {
        console.error('Firebase initialization failed completely:', initError);
        throw initError;
      }
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  console.log('Firebase already initialized, returning existing instance');
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  try {
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    const rtdb = getDatabase(firebaseApp);
    const storage = getStorage(firebaseApp);
    console.log('Firebase SDKs initialized successfully');
    return {
      firebaseApp,
      auth,
      firestore,
      rtdb,
      storage
    };
  } catch (error) {
    console.error('Error initializing Firebase SDKs:', error);
    throw error;
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
