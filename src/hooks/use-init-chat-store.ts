
'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useChatStore } from './useChatStore';

export function InitChatStore() {
  const params = useParams();
  const spaceSlug = params.spaceSlug as string;
  const { setMembers } = useChatStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent this from running multiple times in strict mode
    if (initialized.current) return;
    initialized.current = true;

    if (typeof window !== 'undefined' && spaceSlug) {
      const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
      const allMembersRaw = localStorage.getItem(`allMembers-for-${spaceSlug}`);

      if (memberId && allMembersRaw) {
        try {
          const allMembers = JSON.parse(allMembersRaw);
          const partner = allMembers.find((m: { id: string }) => m.id !== memberId);
          if (partner) {
            setMembers(memberId, partner.id);
          }
        } catch (e) {
          console.error("Failed to parse members for chat store", e);
        }
      }
    }
  }, [spaceSlug, setMembers]);

  return null; // This component does not render anything
}
