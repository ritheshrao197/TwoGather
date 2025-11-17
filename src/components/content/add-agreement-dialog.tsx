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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';

interface AddAgreementDialogProps {
  spaceId: string;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAgreementDialog({
  spaceId,
  authorId,
  open,
  onOpenChange,
}: AddAgreementDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Missing Title', description: 'Please provide a title for the agreement.' });
      return;
    }
    if (!authorId) {
      toast({ variant: 'destructive', title: 'Unknown Author', description: 'Cannot add an agreement without being identified.' });
      return;
    }

    setIsLoading(true);

    const contentRef = collection(firestore, `spaces/${spaceId}/content`);
    const newAgreement = {
      spaceId,
      authorMemberId: authorId,
      type: 'agreement',
      payload: {
        title,
        description,
        status: 'active',
      },
      visibility: 'members',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      addDocumentNonBlocking(contentRef, newAgreement);
      toast({ title: 'Agreement Added!', description: 'Your new agreement has been added to the board.' });
      setTitle('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding agreement:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add the agreement. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New Agreement</DialogTitle>
          <DialogDescription>
            Create a new shared commitment, rule, or habit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., No phones during dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add more details about this agreement."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Agreement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
