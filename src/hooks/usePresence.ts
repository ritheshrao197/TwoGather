'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { useFirebase } from '@/firebase';

export interface PresenceState {
  online: boolean;
  lastSeen: number | object;
}

export interface SpacePresence {
  [memberId: string]: PresenceState;
}

/**
 * A hook to manage and subscribe to presence status in a shared space.
 * @param spaceId The ID of the shared space.
 * @param memberId The ID of the current member.
 * @returns An object containing presence info for all members in the space.
 */
export function usePresence(spaceId: string, memberId: string | null) {
  const { rtdb } = useFirebase();
  const [presence, setPresence] = useState<SpacePresence>({});

  useEffect(() => {
    if (!spaceId || !memberId) {
      setPresence({});
      return;
    }

    const myRef = ref(rtdb, `realtime/presence/${spaceId}/${memberId}`);
    const spaceRef = ref(rtdb, `realtime/presence/${spaceId}`);

    // Set online status when connection is established
    set(myRef, { online: true, lastSeen: serverTimestamp() });

    // Set offline status on disconnect
    onDisconnect(myRef).set({ online: false, lastSeen: serverTimestamp() });

    // Listen for presence changes for all members in the space
    const unsubscribe = onValue(spaceRef, (snap) => {
      const val = snap.val() || {};
      setPresence(val);
    });

    // Cleanup on unmount or when dependencies change
    return () => {
      unsubscribe();
      // Explicitly set offline when leaving the component, though onDisconnect should handle it
      set(myRef, { online: false, lastSeen: serverTimestamp() });
    };
  }, [spaceId, memberId, rtdb]);

  return presence;
}
