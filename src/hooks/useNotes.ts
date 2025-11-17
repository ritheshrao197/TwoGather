
'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { UseCollectionResult } from '@/firebase/firestore/use-collection';

// Define the shape of a single note's payload
export interface NotePayload {
  text: string;
}

// Define the shape of the full content document for a note
export interface NoteDocument {
  id: string;
  authorMemberId: string;
  type: 'note';
  payload: NotePayload;
  visibility: 'members' | 'public';
  createdAt: any; // Firestore Timestamp
}

/**
 * A custom hook to fetch all notes for a given space.
 * It filters the 'content' collection for documents of type 'note'.
 *
 * @param {string} spaceId - The ID of the space to fetch notes for.
 * @returns {UseCollectionResult<NoteDocument>} - The result object from useCollection, typed for NoteDocuments.
 */
export const useNotes = (
  spaceId: string
): UseCollectionResult<NoteDocument> => {
  const { firestore } = useFirebase();

  // Memoize the query to prevent re-renders.
  // The query will only be re-created if `firestore` or `spaceId` changes.
  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !spaceId) return null;

    // Create a reference to the content subcollection for the given space
    const contentRef = collection(firestore, `spaces/${spaceId}/content`);

    // Build a query to:
    // 1. Get only documents where the type is 'note'
    // 2. Order the results by creation date, with the newest notes first
    return query(
      contentRef,
      where('type', '==', 'note'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, spaceId]);

  // Use the generic useCollection hook with our specific query and type
  const result = useCollection<NoteDocument>(notesQuery);

  return result;
};
