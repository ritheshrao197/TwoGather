
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AddVaultEntryDialog } from '@/components/content/add-vault-entry-dialog';
import { decrypt } from '@/lib/vault-crypto';
import { ArrowLeft, Plus, Lock } from 'lucide-react';
import { format } from 'date-fns';

interface VaultEntryPayload {
  encryptedText: string;
}

interface VaultEntryDocument {
  id: string;
  authorMemberId: string;
  type: 'vault_entry';
  payload: VaultEntryPayload;
  createdAt: Timestamp;
}

interface DecryptedEntry {
  id: string;
  decryptedText: string;
  createdAt: Date;
}

export default function VaultPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [decryptedEntries, setDecryptedEntries] = useState<DecryptedEntry[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);

  useEffect(() => {
    const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
    if (!memberId) {
      router.push(`/space/${spaceSlug}/lobby`);
    } else {
      setCurrentMemberId(memberId);
    }
  }, [spaceSlug, router]);

  const vaultEntriesQuery = useMemoFirebase(() => {
    if (!firestore || !spaceSlug || !currentMemberId) return null;
    return query(
      collection(firestore, `spaces/${spaceSlug}/content`),
      where('type', '==', 'vault_entry'),
      where('authorMemberId', '==', currentMemberId)
    );
  }, [firestore, spaceSlug, currentMemberId]);

  const { data: vaultEntries, isLoading: isLoadingEntries } = useCollection<VaultEntryDocument>(vaultEntriesQuery);

  useEffect(() => {
    if (!vaultEntries) {
        setIsDecrypting(false);
        return;
    };

    const decryptAll = async () => {
        setIsDecrypting(true);
        const decrypted = await Promise.all(
            vaultEntries.map(async (entry) => {
                const decryptedText = await decrypt(entry.payload.encryptedText);
                return {
                    id: entry.id,
                    decryptedText,
                    createdAt: entry.createdAt.toDate(),
                };
            })
        );
        decrypted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setDecryptedEntries(decrypted);
        setIsDecrypting(false);
    };

    decryptAll();
  }, [vaultEntries]);

  const isLoading = isLoadingEntries || isDecrypting;

  if (!currentMemberId) {
    return <div className="flex items-center justify-center min-h-dvh"><p>Verifying access...</p></div>;
  }

  return (
    <>
      <AddVaultEntryDialog 
        spaceId={spaceSlug} 
        authorId={currentMemberId} 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Lock className="w-10 h-10 text-primary" />
              <div>
                <h1 className="text-4xl font-headline font-bold">My Vault</h1>
                <p className="text-muted-foreground font-caption mt-1">Your private, encrypted entries. Only you can see these.</p>
              </div>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2" /> New Entry
            </Button>
          </div>

          {isLoading && <p className="text-center font-caption text-muted-foreground">Loading and decrypting entries...</p>}

          {!isLoading && decryptedEntries.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="font-headline text-xl">Your Vault is Empty</h3>
                <p className="font-caption text-muted-foreground mt-2">Create your first private entry to get started.</p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2" /> Add an Entry
                </Button>
            </div>
          )}

          <div className="space-y-6">
            {decryptedEntries.map(entry => (
              <Card key={entry.id} className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-caption text-sm font-normal text-muted-foreground">
                    {format(entry.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap font-serif">{entry.decryptedText}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
             <Button asChild variant="outline">
                <Link href={`/space/${spaceSlug}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Your Space
                </Link>
             </Button>
          </div>
        </main>
      </div>
    </>
  );
}

    