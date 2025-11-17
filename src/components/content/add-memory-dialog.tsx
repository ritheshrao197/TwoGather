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

interface AddMemoryDialogProps {
  spaceId: string;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemoryDialog({
  spaceId,
  authorId,
  open,
  onOpenChange,
}: AddMemoryDialogProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const handleSubmitMemory = async () => {
    if (!imageUrl.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Image',
        description: 'Please provide an image URL for the memory.',
      });
      return;
    }
    if (!authorId) {
      toast({
        variant: 'destructive',
        title: 'Unknown Author',
        description: 'Cannot post a memory without being identified. Please re-enter the space.',
      });
      return;
    }

    setIsLoading(true);

    const contentRef = collection(firestore, `spaces/${spaceId}/content`);
    const newMemory = {
      spaceId,
      authorMemberId: authorId,
      type: 'memory',
      payload: {
        imageUrl,
        caption,
      },
      visibility: 'members',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      addDocumentNonBlocking(contentRef, newMemory);

      toast({
        title: 'Memory Added!',
        description: 'Your memory has been added to the wall.',
      });
      setImageUrl('');
      setCaption('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding memory:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh!',
        description: 'Could not add your memory. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New Memory</DialogTitle>
          <DialogDescription>
            Share a photo and a thought to add to your shared memory wall.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="https://example.com/your-image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea
              id="caption"
              placeholder="What do you remember about this moment?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmitMemory}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Memory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
