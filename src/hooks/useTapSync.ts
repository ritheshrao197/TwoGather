'use client';

import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, push, serverTimestamp, runTransaction } from 'firebase/database';
import { useFirebase } from '@/firebase';

const SYNC_WINDOW_MS = 5000; // 5 seconds
const TAP_EXPIRATION_MS = 10000; // 10 seconds

interface Tap {
  memberId: string;
  ts: number;
}

interface UseTapSyncResult {
  handleTap: () => void;
  isSyncing: boolean;
  syncSuccess: boolean;
}

/**
 * A hook to manage the "Tap to Sync" functionality.
 * @param spaceId The ID of the shared space.
 * @param memberId The ID of the current member.
 * @param onSyncSuccess Callback function to run when a sync is successful.
 */
export function useTapSync(
  spaceId: string,
  memberId: string | null,
  onSyncSuccess?: () => void
): UseTapSyncResult {
  const { rtdb } = useFirebase();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleTap = useCallback(async () => {
    if (!spaceId || !memberId) return;

    const tapsRef = ref(rtdb, `realtime/sync/${spaceId}`);
    setIsSyncing(true);
    setSyncSuccess(false);

    await push(tapsRef, {
      memberId,
      ts: serverTimestamp(),
    });

    // Reset syncing state after a short period
    setTimeout(() => setIsSyncing(false), SYNC_WINDOW_MS);
  }, [spaceId, memberId, rtdb]);

  useEffect(() => {
    if (!spaceId || !memberId) return;

    const tapsRef = ref(rtdb, `realtime/sync/${spaceId}`);

    const unsubscribe = onValue(tapsRef, (snapshot) => {
      const now = Date.now();
      const taps: { key: string; value: Tap }[] = [];
      snapshot.forEach((child) => {
        taps.push({ key: child.key!, value: child.val() });
      });

      // Filter for recent taps and clean up old ones
      const recentTaps = taps.filter(
        (tap) => now - tap.value.ts < TAP_EXPIRATION_MS
      );
      
      const myTap = recentTaps.find(tap => tap.value.memberId === memberId);
      const partnerTap = recentTaps.find(tap => tap.value.memberId !== memberId);

      if (myTap && partnerTap) {
        const timeDiff = Math.abs(myTap.value.ts - partnerTap.value.ts);

        if (timeDiff < SYNC_WINDOW_MS) {
          setSyncSuccess(true);
          onSyncSuccess?.();
          
          // Cleanup taps after successful sync
           runTransaction(tapsRef, () => {
             return null;
           });

          setTimeout(() => setSyncSuccess(false), 2000);
        }
      }
      
      // Cleanup expired taps that weren't part of a successful sync
      const tapsToRemove = taps.filter(
        (tap) => now - tap.value.ts >= TAP_EXPIRATION_MS
      );

      if(tapsToRemove.length > 0) {
        runTransaction(tapsRef, (currentData) => {
            if (currentData === null) return null;
            tapsToRemove.forEach(tap => {
                delete currentData[tap.key];
            });
            return currentData;
        });
      }
    });

    return () => unsubscribe();
  }, [spaceId, memberId, rtdb, onSyncSuccess]);

  return { handleTap, isSyncing, syncSuccess };
}
