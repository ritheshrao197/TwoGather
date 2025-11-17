'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { AddMemoryDialog } from '@/components/content/add-memory-dialog';
import { formatDistanceToNow } from 'date-fns';

interface MemoryPayload {
  imageUrl: string;
  caption?: string;
}

interface MemoryDocument {
  id: string;
  authorMemberId: string;
  type: 'memory';
  payload: MemoryPayload;
  createdAt: Timestamp;
}

export default function MemoryWallPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [isAddMemoryDialogOpen, setIsAddMemoryDialogOpen] = useState(false);

  useEffect(() => {
    const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
    if (!memberId) {
      router.push(`/space/${spaceSlug}/lobby`);
    } else {
      setCurrentMemberId(memberId);
    }
  }, [spaceSlug, router]);

  const memoriesQuery = useMemoFirebase(() => {
    if (!firestore || !spaceSlug) return null;
    return query(collection(firestore, `spaces/${spaceSlug}/content`), where('type', '==', 'memory'));
  }, [firestore, spaceSlug]);

  const { data: memoriesData, isLoading: memoriesLoading } = useCollection<MemoryDocument>(memoriesQuery);

  const sortedMemories = useMemo(() => {
    if (!memoriesData) return [];
    return [...memoriesData].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  }, [memoriesData]);

  const getMemberName = (id: string) => id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (!currentMemberId) {
    return (
        <div className="flex flex-col min-h-dvh bg-background text-foreground">
            <main className="flex-1 flex items-center justify-center">
                <p>Loading...</p>
            </main>
        </div>
    );
  }

  return (
    <>
      {currentMemberId && <AddMemoryDialog spaceId={spaceSlug} authorId={currentMemberId} open={isAddMemoryDialogOpen} onOpenChange={setIsAddMemoryDialogOpen} />}
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-headline font-bold">Memory Wall</h1>
              <p className="text-muted-foreground font-caption mt-1">A shared timeline of your favorite moments.</p>
            </div>
            <Button onClick={() => setIsAddMemoryDialogOpen(true)}>
              <Plus className="mr-2" /> Add Memory
            </Button>
          </div>

          {memoriesLoading && (
            <div className="text-center">
              <p className="font-caption text-muted-foreground">Loading memories...</p>
            </div>
          )}

          {!memoriesLoading && sortedMemories.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="font-headline text-xl">Your Wall is Empty</h3>
                <p className="font-caption text-muted-foreground mt-2">Why not add the first memory?</p>
                <Button className="mt-4" onClick={() => setIsAddMemoryDialogOpen(true)}>
                    <Plus className="mr-2" /> Add a Memory
                </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedMemories.map(memory => (
                <Card key={memory.id} className="overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="relative aspect-square">
                            <Image
                                src={memory.payload.imageUrl}
                                alt={memory.payload.caption || 'Memory'}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        </div>
                         <div className="p-4">
                           {memory.payload.caption && <p className="font-caption text-sm">{memory.payload.caption}</p>}
                            <p className="text-xs text-muted-foreground mt-2">
                                Added by {getMemberName(memory.authorMemberId)} • {formatDistanceToNow(memory.createdAt.toDate(), { addSuffix: true })}
                            </p>
                        </div>
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
