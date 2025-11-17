'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    try {
      // Initialize Firebase on the client side, once per component mount.
      console.log('Initializing Firebase services...');
      const services = initializeFirebase();
      console.log('Firebase services initialized successfully');
      return services;
    } catch (error) {
      console.error('Error initializing Firebase services:', error);
      throw new Error('Failed to initialize Firebase services: ' + (error as Error).message);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}