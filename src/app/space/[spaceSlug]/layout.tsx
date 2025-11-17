
'use client';

import { ReactNode } from 'react';
import { ChatPanel } from '@/components/chat/chat-panel';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '@/hooks/useChatStore';
import { InitChatStore } from '@/hooks/use-init-chat-store';
import { usePendingMessages } from '@/hooks/usePendingMessages';

export default function SpaceLayout({ children }: { children: ReactNode }) {
  const { toggleChat, currentMemberId } = useChatStore();
  
  // Initialize the hook to check for pending messages
  usePendingMessages();

  return (
    <>
      <InitChatStore />
      {children}
      <ChatPanel />
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={toggleChat}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>
    </>
  );
}
