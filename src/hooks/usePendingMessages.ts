
'use client';

import { useEffect, useRef } from 'react';
import { useFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { useChatStore } from './useChatStore';
import { useParams } from 'next/navigation';

/**
 * A hook to check for and process pending chat messages stored in Firestore.
 * It fetches messages addressed to the current user, adds them to the chat store,
 * and then deletes them from the server.
 */
export function usePendingMessages() {
  const { firestore } = useFirebase();
  const { currentMemberId, addMessage } = useChatStore();
  const params = useParams();
  const spaceSlug = params.spaceSlug as string;

  // Use a ref to keep track of processed message IDs to avoid race conditions
  const processedMessageIds = useRef(new Set());

  useEffect(() => {
    if (!firestore || !spaceSlug || !currentMemberId) {
      return;
    }

    const pendingMessagesRef = collection(firestore, `spaces/${spaceSlug}/pendingMessages`);
    const q = query(pendingMessagesRef, where('toMemberId', '==', currentMemberId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        return;
      }
      
      const batch = writeBatch(firestore);
      const messagesToAdd = [];

      snapshot.forEach((messageDoc) => {
        const messageId = messageDoc.id;
        // Ensure we don't process the same message multiple times
        if (processedMessageIds.current.has(messageId)) {
          return;
        }

        processedMessageIds.current.add(messageId);

        const data = messageDoc.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate().getTime() : Date.now();
        
        messagesToAdd.push({
          id: messageId,
          authorId: data.fromMemberId,
          text: data.text,
          timestamp: timestamp,
        });

        // Add the delete operation to the batch
        batch.delete(doc(firestore, `spaces/${spaceSlug}/pendingMessages`, messageId));
      });
      
      if(messagesToAdd.length > 0) {
        // Add all new messages to the store
        messagesToAdd.forEach(msg => addMessage(msg));

        // Commit the batch delete
        batch.commit().catch(err => {
            console.error("Failed to delete pending messages:", err);
            // If deletion fails, remove the ids from the processed set so we can try again
            messagesToAdd.forEach(msg => processedMessageIds.current.delete(msg.id));
        });
      }

    });

    return () => unsubscribe();
  }, [firestore, spaceSlug, currentMemberId, addMessage]);
}
