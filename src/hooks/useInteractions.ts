
'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { UseCollectionResult } from '@/firebase/firestore/use-collection';
import { useMemo } from 'react';

// Define the shape of various interaction payloads
export interface CheckInPayload {
  mood: string;
  text?: string;
}

export interface GratitudePayload {
  message: string;
}

export interface QuickQuestionPayload {
  question: string;
  answer: string;
}

// Define the shape of the full content document for an interaction
export interface InteractionDocument {
  id: string;
  authorMemberId: string;
  targetMemberId?: string;
  type: 'check-in' | 'gratitude' | 'quick_question_response';
  payload: CheckInPayload | GratitudePayload | QuickQuestionPayload;
  visibility: 'members' | 'public';
  createdAt: Timestamp; // Firestore Timestamp
}

/**
 * A custom hook to fetch all interactions for a given space.
 * It filters the 'content' collection for documents of relevant types.
 *
 * @param {string} spaceId - The ID of the space to fetch interactions for.
 * @returns {UseCollectionResult<InteractionDocument>} - The result object from useCollection.
 */
export const useInteractions = (
  spaceId: string
): UseCollectionResult<InteractionDocument> => {
  const { firestore } = useFirebase();

  // Memoize the query to prevent re-renders.
  const interactionsQuery = useMemoFirebase(() => {
    if (!firestore || !spaceId) return null;

    const contentRef = collection(firestore, `spaces/${spaceId}/content`);
    
    // Query for documents that are one of the interaction types.
    // Firestore's `in` operator is perfect for this.
    return query(
      contentRef,
      where('type', 'in', ['check-in', 'gratitude', 'quick_question_response'])
    );
  }, [firestore, spaceId]);

  const { data, ...rest } = useCollection<InteractionDocument>(interactionsQuery);

  // Memoize the sorted data to prevent re-sorting on every render
  const sortedData = useMemo(() => {
    if (!data) return null;

    // Sort by creation date, newest first.
    return [...data].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [data]);

  return { data: sortedData, ...rest };
};
