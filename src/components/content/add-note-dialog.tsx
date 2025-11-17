
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';

interface AddNoteDialogProps {
  spaceId: string;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNoteDialog({
  spaceId,
  authorId,
  open,
  onOpenChange,
}: AddNoteDialogProps) {
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const handleSubmitNote = async () => {
    if (!noteText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Note',
        description: 'Please write something before submitting.',
      });
      return;
    }
    if (!authorId) {
      toast({
        variant: 'destructive',
        title: 'Unknown Author',
        description: 'Cannot post a note without being identified. Please re-enter the space.',
      });
      return;
    }

    setIsLoading(true);

    const contentRef = collection(firestore, `spaces/${spaceId}/content`);
    const newNote = {
      spaceId,
      authorMemberId: authorId,
      type: 'note',
      payload: {
        text: noteText,
      },
      visibility: 'members',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      addDocumentNonBlocking(contentRef, newNote);

      toast({
        title: 'Note Added!',
        description: 'Your note has been posted.',
      });
      setNoteText('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh!',
        description: 'Could not add your note. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Write a Quick Note</DialogTitle>
          <DialogDescription>
            Leave a message of appreciation, a reminder, or just a thought for
            your partner.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="note-text">Your Note</Label>
            <Textarea
              id="note-text"
              placeholder="Type your message here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmitNote}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
