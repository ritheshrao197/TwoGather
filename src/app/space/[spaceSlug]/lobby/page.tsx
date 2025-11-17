'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';

interface SpaceData {
  displayName: string;
}

interface MemberData {
  id: string;
  displayName: string;
}

export default function SpaceLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const spaceSlug = params.spaceSlug as string;

  const memoizedSpaceRef = useMemoFirebase(
    () => (firestore && spaceSlug ? doc(firestore, 'spaces', spaceSlug) : null),
    [firestore, spaceSlug]
  );

  const memoizedMembersRef = useMemoFirebase(
    () => (firestore && spaceSlug ? collection(firestore, 'spaces', spaceSlug, 'members') : null),
    [firestore, spaceSlug]
  );
  
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch space data to verify it exists
  useEffect(() => {
    const fetchSpace = async () => {
        if (!memoizedSpaceRef) return;
        try {
            const spaceSnap = await getDoc(memoizedSpaceRef);
            if (spaceSnap.exists()) {
                setSpaceData(spaceSnap.data() as SpaceData);
            } else {
                 toast({ variant: 'destructive', title: 'Not Found', description: 'This space does not exist.' });
                 router.push('/enter');
            }
        } catch (error) {
            console.error("Error fetching space:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load space details.' });
            router.push('/enter');
        } finally {
            setIsLoading(false);
        }
    };
    fetchSpace();
  }, [memoizedSpaceRef, router, toast]);


  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
  } = useCollection<MemberData>(memoizedMembersRef);


  const handleEnterAsMember = (memberId: string) => {
    // In this simplified flow, we store the chosen member ID in local storage
    // to "log them in" for the session.
    localStorage.setItem(`memberId-for-${spaceSlug}`, memberId);
    router.push(`/space/${spaceSlug}`);
  };

  const pageIsLoading = isLoading || membersLoading;

  if (pageIsLoading) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="mt-4 font-caption text-muted-foreground">Entering the lobby...</p>
        </main>
      </div>
    );
  }
  
  if (membersError) {
      return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-3xl font-headline">Access Denied</h1>
          <p className="mt-2 font-caption text-muted-foreground">You don't have permission to view this lobby.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/enter">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
            {spaceData?.displayName}
          </h1>
          <p className="mt-3 max-w-md mx-auto text-muted-foreground font-caption">
            Who is entering the space?
          </p>
        </div>

        <div className="w-full max-w-md">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {(membersData || []).map((member) => (
               <Card key={member.id} className="text-center hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group" onClick={() => handleEnterAsMember(member.id)}>
                 <CardHeader>
                   <CardTitle>{member.displayName}</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <User className="w-16 h-16 mx-auto text-muted-foreground" />
                 </CardContent>
                 <CardContent>
                    <Button className="w-full">Enter as {member.displayName}</Button>
                 </CardContent>
               </Card>
             ))}
           </div>
        </div>
        
        <Button asChild variant="outline" className="mt-12">
            <Link href="/enter">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Entrance
            </Link>
        </Button>
      </main>
    </div>
  );
}
