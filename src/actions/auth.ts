'use server';

import {initFirebaseAdmin} from '@/firebase/server';

interface VerifySpacePasswordInput {
  spaceSlug: string;
  spacePassword: any;
}

interface VerifySpacePasswordOutput {
  success: boolean;
  error?: string;
}

export async function verifySpacePassword(
  input: VerifySpacePasswordInput
): Promise<VerifySpacePasswordOutput> {
  try {
    // Try to initialize Firebase Admin first
    const adminApp = await initFirebaseAdmin();
    
    // In development mode, bypass the Firebase verification entirely
    // This is only for development and should not be used in production
    if (process.env.NODE_ENV === 'development') {
      console.log('Bypassing Firebase verification in development mode');
      return {success: true};
    }
    
    // If we're in production and Firebase Admin is not available, return an error
    if (!adminApp) {
      return {success: false, error: 'Server configuration error. Please contact the administrator.'};
    }
    
    // In production with Firebase Admin available, we would do the actual verification
    // For now, we'll just return success to allow development to continue
    return {success: true};
  } catch (error: any) {
    console.error('Error in verifySpacePassword:', error);
    
    // In development mode, still bypass errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Bypassing error in development mode:', error.message);
      return {success: true};
    }
    
    // Provide more specific error messages for production
    if (error.code === 'permission-denied') {
      return {success: false, error: 'Permission denied. Please check your Firebase configuration.'};
    } else if (error.code === 'unauthenticated') {
      return {success: false, error: 'Authentication failed. Please check your Firebase credentials.'};
    } else if (error.message && (error.message.includes('Unable to detect a Project Id') || error.message.includes('default credentials'))) {
      return {success: false, error: 'Server configuration error. Please contact the administrator.'};
    } else {
      return {success: false, error: 'An unexpected server error occurred. Please try again.'};
    }
  }
}