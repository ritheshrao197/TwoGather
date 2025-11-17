
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/hooks/useChatStore';
import { Send, X, Wifi, WifiOff, MessageCircle } from 'lucide-react';
import { usePresence } from '@/hooks/usePresence';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export function ChatPanel() {
  const { isChatOpen, toggleChat } = useChatStore();
  const params = useParams();
  const spaceSlug = params.spaceSlug as string;

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [partnerMemberId, setPartnerMemberId] = useState<string | null>(null);

  useEffect(() => {
    const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
    const allMembers = JSON.parse(localStorage.getItem(`allMembers-for-${spaceSlug}`) || '[]');
    const partner = allMembers.find((m: { id: string }) => m.id !== memberId);
    
    setCurrentMemberId(memberId);
    if (partner) {
      setPartnerMemberId(partner.id);
    }
  }, [spaceSlug]);
  
  const presence = usePresence(spaceSlug, currentMemberId);
  const partnerPresence = partnerMemberId ? presence[partnerMemberId] : null;
  const isPartnerOnline = partnerPresence?.online ?? false;

  const messages = [
    { id: 1, author: 'partner', text: 'Hey, how was your day?', ts: '5 min ago' },
    { id: 2, author: 'me', text: 'It was pretty good! Finally finished that big project.', ts: '4 min ago' },
    { id: 3, author: 'partner', text: 'That\'s awesome! We should celebrate this weekend.', ts: '3 min ago' },
  ];

  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 z-50 transition-all duration-300 ease-in-out',
        'lg:bottom-4 lg:right-4',
        isChatOpen ? 'w-full h-full lg:w-[380px] lg:h-[calc(100vh-2rem)]' : 'w-0 h-0'
      )}
    >
      <Card
        className={cn(
          'flex flex-col h-full w-full transform transition-all duration-300 ease-in-out',
          isChatOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-3">
                <MessageCircle className="text-primary"/>
                <div>
                    <CardTitle className="text-lg">Private Chat</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                        {isPartnerOnline ? (
                            <><Wifi className="text-green-500 w-3 h-3"/> Partner is online</>
                        ) : (
                            <><WifiOff className="text-muted-foreground w-3 h-3"/> Partner is offline</>
                        )}
                    </CardDescription>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleChat}>
                <X className="h-4 w-4" />
            </Button>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-end gap-2',
                    message.author === 'me' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.author === 'partner' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${partnerMemberId}`} />
                      <AvatarFallback>{partnerMemberId?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg p-3 text-sm',
                      message.author === 'me'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p>{message.text}</p>
                     <p className={cn("text-xs mt-1", message.author === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>{message.ts}</p>
                  </div>
                  {message.author === 'me' && (
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${currentMemberId}`} />
                        <AvatarFallback>{currentMemberId?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-4 flex-col items-start gap-2">
            <div className="flex w-full items-center gap-2">
                <Textarea
                    placeholder="Type a message..."
                    className="flex-1 resize-none"
                    rows={1}
                />
                <Button>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                This chat is peer-to-peer. Messages are not stored on the server.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
