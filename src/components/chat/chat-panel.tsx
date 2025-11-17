
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/hooks/useChatStore';
import { Send, X, Wifi, WifiOff, MessageCircle, Loader2 } from 'lucide-react';
import { usePresence } from '@/hooks/usePresence';
import { useParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export function ChatPanel() {
  const { 
    isChatOpen, 
    toggleChat, 
    messages, 
    addMessage, 
    currentMemberId, 
    partnerMemberId 
  } = useChatStore();
  const params = useParams();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();
  
  const presence = usePresence(spaceSlug, currentMemberId);
  const partnerPresence = partnerMemberId ? presence[partnerMemberId] : null;
  const isPartnerOnline = partnerPresence?.online ?? false;

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentMemberId || !partnerMemberId) return;

    setIsSending(true);

    const message = {
      id: new Date().toISOString(),
      authorId: currentMemberId,
      text: messageText,
      timestamp: Date.now(),
    };
    
    // Optimistically add message to local UI
    addMessage(message);
    setMessageText('');

    if (!isPartnerOnline) {
      // Partner is offline, store message in Firestore
      try {
        const pendingMessagesRef = collection(firestore, `spaces/${spaceSlug}/pendingMessages`);
        await addDoc(pendingMessagesRef, {
          fromMemberId: currentMemberId,
          toMemberId: partnerMemberId,
          text: message.text,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to send offline message:", error);
        // Here you could add logic to show an error in the UI for the specific message
      }
    } else {
      // Partner is online, send via WebRTC (when implemented)
      // For now, it's just added locally.
    }

    setIsSending(false);
  };
  
  const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);

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
              {sortedMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-end gap-2',
                    message.authorId === currentMemberId ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.authorId === partnerMemberId && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${partnerMemberId}`} />
                      <AvatarFallback>{partnerMemberId?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg p-3 text-sm',
                      message.authorId === currentMemberId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p>{message.text}</p>
                     <p className={cn("text-xs mt-1", message.authorId === currentMemberId ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                       {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </p>
                  </div>
                  {message.authorId === currentMemberId && (
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
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending}
                />
                <Button onClick={handleSendMessage} disabled={isSending || !messageText.trim()}>
                    {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Offline messages will be sent when your partner comes online.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
