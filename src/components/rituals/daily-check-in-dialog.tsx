
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';

interface DailyCheckInDialogProps {
  spaceId: string;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const moodEmojis = ['😊', '😄', '😌', '🤔', '😢', '😴', '😠'];

export function DailyCheckInDialog({
  spaceId,
  authorId,
  open,
  onOpenChange,
}: DailyCheckInDialogProps) {
  const [message, setMessage] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const handleCheckIn = async () => {
    if (!authorId) return;

    setIsLoading(true);
    const contentRef = collection(firestore, `spaces/${spaceId}/content`);
    const newCheckIn = {
      spaceId,
      authorMemberId: authorId,
      type: 'check-in',
      payload: {
        mood: selectedMood,
        text: message,
      },
      visibility: 'members',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      addDocumentNonBlocking(contentRef, newCheckIn);
      toast({
        title: 'Checked In!',
        description: 'Your daily check-in has been shared.',
      });
      setMessage('');
      setSelectedMood('😊');
      onOpenChange(false);
    } catch (error) {
      console.error('Error with daily check-in:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not complete your check-in. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily Check-in</DialogTitle>
          <DialogDescription>
            How are you feeling right now? Share a mood and an optional thought.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-around rounded-lg bg-muted p-2">
            {moodEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedMood(emoji)}
                className={`text-2xl p-2 rounded-md transition-transform duration-200 ${
                  selectedMood === emoji
                    ? 'transform scale-125 bg-primary/20'
                    : 'hover:scale-110'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="A thought for today... (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCheckIn}
            disabled={isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share Check-in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
