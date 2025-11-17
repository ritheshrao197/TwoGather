'use server';

import {getFirestore} from 'firebase-admin/firestore';
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
    await initFirebaseAdmin();
    const firestore = getFirestore();

    const spaceRef = firestore.collection('spaces').doc(input.spaceSlug);
    const spaceDoc = await spaceRef.get();

    if (!spaceDoc.exists) {
      return {success: false, error: 'Space not found.'};
    }

    const spaceData = spaceDoc.data();
    // TODO: Use a proper hash comparison
    if (spaceData?.spacePasswordHash !== input.spacePassword) {
      return {success: false, error: 'Invalid password.'};
    }

    return {success: true};
  } catch (error) {
    console.error('Error in verifySpacePassword:', error);
    return {success: false, error: 'An unexpected server error occurred.'};
  }
}
