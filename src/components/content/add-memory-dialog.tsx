
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
import { Loader2 } from 'lucide-react';
import { getCaptionSuggestions } from '@/ai/flows/memory-wall-caption-suggestions';

interface AddMemoryDialogProps {
  spaceId: string;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const compressImage = (file: File, maxSize: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Get the data-URL as a JPEG image with a quality setting
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


export function AddMemoryDialog({
  spaceId,
  authorId,
  open,
  onOpenChange,
}: AddMemoryDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleGenerateCaptions = async () => {
    if (!imageFile) {
        toast({
            variant: 'destructive',
            title: 'No Image',
            description: 'Please select an image first to generate captions.',
        });
        return;
    }

    try {
        const result = await getCaptionSuggestions({
            imageDescription: "A photo for a couple's memory wall.", // This can be improved
            additionalContext: "The memory is being added to a private space for a couple."
        });

        if (result.captions && result.captions.length > 0) {
            setCaption(result.captions[0]); // Use the first suggestion
            toast({
                title: 'Caption Suggested!',
                description: 'We\'ve added a suggestion for your caption.',
            });
        }
    } catch (error) {
        console.error("Error generating captions:", error);
        toast({
            variant: 'destructive',
            title: 'AI Error',
            description: 'Could not generate caption suggestions at this time.',
        });
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
      // 1. Compress the image and get a Data URI
      const imageUrl = await compressImage(imageFile);

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
             <Button variant="link" size="sm" className="justify-end px-0" onClick={handleGenerateCaptions} disabled={!imageFile}>
                Generate with AI
            </Button>
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
