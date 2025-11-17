
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
import { encrypt } from '@/lib/vault-crypto';
import { Loader2 } from 'lucide-react';

interface AddVaultEntryDialogProps {
  spaceId: string;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVaultEntryDialog({
  spaceId,
  authorId,
  open,
  onOpenChange,
}: AddVaultEntryDialogProps) {
  const [entryText, setEntryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!entryText.trim()) {
      toast({ variant: 'destructive', title: 'Empty Entry', description: 'Please write something to save to your vault.' });
      return;
    }
    if (!authorId) {
      toast({ variant: 'destructive', title: 'Unknown Author', description: 'Cannot save entry without being identified.' });
      return;
    }

    setIsLoading(true);

    try {
      const encryptedText = await encrypt(entryText);
      
      const contentRef = collection(firestore, `spaces/${spaceId}/content`);
      const newVaultEntry = {
        spaceId,
        authorMemberId: authorId,
        type: 'vault_entry',
        payload: {
          encryptedText,
        },
        visibility: 'private', // Only visible to the author
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      addDocumentNonBlocking(contentRef, newVaultEntry);
      toast({ title: 'Entry Saved!', description: 'Your private entry has been saved to the vault.' });
      setEntryText('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving vault entry:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save your entry. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>New Vault Entry</DialogTitle>
          <DialogDescription>
            This entry will be client-side encrypted. You can use Markdown for formatting. Only you can read it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="entry-text">Your Private Thoughts</Label>
            <Textarea
              id="entry-text"
              placeholder="Write anything you want... it's safe here. Use **bold** or *italic* for formatting."
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              rows={8}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : 'Save to Vault'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
