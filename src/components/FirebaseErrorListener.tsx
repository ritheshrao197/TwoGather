'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It shows a toast notification instead of throwing the error.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  
  useEffect(() => {
    // The callback now expects a strongly-typed error, matching the event payload.
    const handleError = (error: FirestorePermissionError) => {
      console.error('Firebase Permission Error:', error);
      
      // Show a user-friendly toast notification
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to perform this action. Please check your account and try again.',
      });
    };

    // The typed emitter will enforce that the callback for 'permission-error'
    // matches the expected payload type (FirestorePermissionError).
    errorEmitter.on('permission-error', handleError);

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // This component renders nothing.
  return null;
}