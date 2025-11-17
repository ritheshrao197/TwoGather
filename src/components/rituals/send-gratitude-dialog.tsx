
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Heart, Send } from 'lucide-react';

interface SendGratitudeDialogProps {
  spaceId: string;
  authorId: string;
  targetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendGratitudeDialog({
  spaceId,
  authorId,
  targetId,
  open,
  onOpenChange,
}: SendGratitudeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const handleSendBlink = async () => {
    if (!authorId || !targetId) return;

    setIsLoading(true);
    const contentRef = collection(firestore, `spaces/${spaceId}/content`);
    const newGratitude = {
      spaceId,
      authorMemberId: authorId,
      targetMemberId: targetId,
      type: 'gratitude',
      payload: {
        message: 'Sent you a little moment of gratitude!',
      },
      visibility: 'members',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      addDocumentNonBlocking(contentRef, newGratitude);
      toast({
        title: 'Gratitude Sent!',
        description: 'A gratitude blink has been sent to your partner.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending gratitude:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not send gratitude. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Heart className="h-6 w-6 text-red-500" />
          </div>
          <DialogTitle className="mt-4">Send a Gratitude Blink</DialogTitle>
          <DialogDescription className="mt-2">
            This sends a small, anonymous "thank you" to your partner to let them know you're thinking of them.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 justify-center">
          <Button
            type="submit"
            onClick={handleSendBlink}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Sending...' : <> <Send className="mr-2 h-4 w-4" /> Send Blink </>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
