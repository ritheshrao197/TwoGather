'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AddAgreementDialog } from '@/components/content/add-agreement-dialog';
import { ArrowLeft, Plus, CheckCircle, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AgreementPayload {
  title: string;
  description?: string;
  status: 'active' | 'completed';
}

interface AgreementDocument {
  id: string;
  authorMemberId: string;
  type: 'agreement';
  payload: AgreementPayload;
  createdAt: Timestamp;
}

export default function AgreementsBoardPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
    if (!memberId) {
      router.push(`/space/${spaceSlug}/lobby`);
    } else {
      setCurrentMemberId(memberId);
    }
  }, [spaceSlug, router]);

  const agreementsQuery = useMemoFirebase(() => {
    if (!firestore || !spaceSlug) return null;
    return query(collection(firestore, `spaces/${spaceSlug}/content`), where('type', '==', 'agreement'));
  }, [firestore, spaceSlug]);

  const { data: agreements, isLoading } = useCollection<AgreementDocument>(agreementsQuery);

  const { activeAgreements, completedAgreements } = useMemo(() => {
    if (!agreements) return { activeAgreements: [], completedAgreements: [] };
    const active = agreements.filter(a => a.payload.status === 'active');
    const completed = agreements.filter(a => a.payload.status === 'completed');
    active.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    completed.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    return { activeAgreements: active, completedAgreements: completed };
  }, [agreements]);
  
  const getMemberName = (id: string) => id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleToggleStatus = async (agreement: AgreementDocument) => {
    if (!firestore) return;
    const newStatus = agreement.payload.status === 'active' ? 'completed' : 'active';
    const agreementRef = doc(firestore, `spaces/${spaceSlug}/content`, agreement.id);
    
    try {
      await updateDoc(agreementRef, {
        'payload.status': newStatus
      });
      toast({
        title: 'Agreement Updated',
        description: `"${agreement.payload.title}" marked as ${newStatus}.`
      });
    } catch (error) {
      console.error("Error updating agreement status:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update the agreement.' });
    }
  };

  if (!currentMemberId) {
    return <div className="flex items-center justify-center min-h-dvh"><p>Loading...</p></div>;
  }

  return (
    <>
      <AddAgreementDialog 
        spaceId={spaceSlug} 
        authorId={currentMemberId} 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-headline font-bold">Agreements Board</h1>
              <p className="text-muted-foreground font-caption mt-1">Shared commitments to stay aligned.</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2" /> Add Agreement
            </Button>
          </div>

          {isLoading && <p className="text-center font-caption text-muted-foreground">Loading agreements...</p>}

          {!isLoading && agreements?.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="font-headline text-xl">Your Board is Empty</h3>
                <p className="font-caption text-muted-foreground mt-2">Create your first agreement to get started.</p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2" /> Add an Agreement
                </Button>
            </div>
          )}

          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-headline font-semibold mb-4">Active</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeAgreements.map(agreement => (
                  <Card key={agreement.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="font-headline">{agreement.payload.title}</CardTitle>
                      {agreement.payload.description && (
                        <CardDescription className="font-caption pt-1">{agreement.payload.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                      {/* Can add more details here in the future */}
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                       <p>
                          Added by {getMemberName(agreement.authorMemberId)} • {formatDistanceToNow(agreement.createdAt.toDate(), { addSuffix: true })}
                       </p>
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(agreement)}>
                         <Circle className="text-primary" />
                       </Button>
                    </CardFooter>
                  </Card>
                ))}
                 {activeAgreements.length === 0 && !isLoading && (
                    <p className="text-muted-foreground font-caption col-span-full text-center py-4">No active agreements.</p>
                )}
              </div>
            </div>

            {completedAgreements.length > 0 && (
              <div>
                <h2 className="text-2xl font-headline font-semibold mb-4">Completed</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedAgreements.map(agreement => (
                    <Card key={agreement.id} className="flex flex-col bg-muted/40">
                      <CardHeader>
                        <CardTitle className="font-headline text-muted-foreground line-through">{agreement.payload.title}</CardTitle>
                      </CardHeader>
                      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                         <p>
                            Completed {formatDistanceToNow(agreement.createdAt.toDate(), { addSuffix: true })}
                         </p>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(agreement)}>
                           <CheckCircle className="text-green-500" />
                         </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
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
