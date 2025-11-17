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
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2 } from 'lucide-react';

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { firestore, storage } = useFirebase();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmitMemory = async () => {
    if (!imageFile) {
      toast({
        variant: 'destructive',
        title: 'Missing Image',
        description: 'Please select an image file to upload.',
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

    try {
      // 1. Upload the image to Firebase Storage
      const imageRef = ref(storage, `spaces/${spaceId}/memories/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Create the memory document in Firestore
      const contentRef = collection(firestore, `spaces/${spaceId}/content`);
      await addDoc(contentRef, {
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
      });

      toast({
        title: 'Memory Added!',
        description: 'Your memory has been added to the wall.',
      });

      // Reset form and close dialog
      setImageFile(null);
      setCaption('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding memory:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh!',
        description: error.message || 'Could not add your memory. Please check permissions and try again.',
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
            <Label htmlFor="image-file">Image</Label>
            <Input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
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
            disabled={isLoading || !imageFile}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Add Memory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
