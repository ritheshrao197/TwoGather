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
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFirebase, useMemoFirebase, useCollection, useDoc, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// Define types for our data
interface SpaceData {
  displayName: string;
}

interface MemberData {
  id: string;
  displayName: string;
  claimed: boolean;
}

export default function SpaceLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();
  const { user, isUserLoading } = useUser();
  const spaceSlug = params.spaceSlug as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // This effect handles the initial authentication check.
  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        setIsAuthenticated(true);
      } else {
        signInAnonymously(auth).then(() => {
          setIsAuthenticated(true);
        }).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Could not connect to the service.'
          });
        });
      }
    }
  }, [isUserLoading, user, auth, toast]);

  // Memoize Firestore references.
  const memoizedSpaceRef = useMemoFirebase(
    () => (isAuthenticated && spaceSlug ? doc(firestore, 'spaces', spaceSlug) : null),
    [isAuthenticated, firestore, spaceSlug]
  );

  const memoizedMembersRef = useMemoFirebase(
    () => (isAuthenticated && spaceSlug ? collection(firestore, 'spaces', spaceSlug, 'members') : null),
    [isAuthenticated, firestore, spaceSlug]
  );

  const {
    data: spaceData,
    isLoading: spaceLoading,
    error: spaceError,
  } = useDoc<SpaceData>(memoizedSpaceRef);

  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
  } = useCollection<MemberData>(memoizedMembersRef);

  
  const handleClaim = (memberId: string) => {
    toast({
      title: 'Claim Your Account',
      description: `Redirecting to the account claim page...`
    });
    router.push(`/claim?space=${spaceSlug}&memberId=${memberId}`);
  };

  const handleEnterAsMember = (member: MemberData) => {
    if (user?.uid === member.id) {
        router.push(`/space/${spaceSlug}`);
    } else {
        toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'This is not your account. Please sign in or claim your own account.',
        });
    }
  }


  const isLoading = spaceLoading || membersLoading || isUserLoading || !isAuthenticated;

  if (isLoading) {
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

  if (isAuthenticated && !spaceData && !isLoading) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-3xl font-headline">Space Not Found</h1>
          <p className="mt-2 font-caption text-muted-foreground">The space "{spaceSlug}" doesn't seem to exist.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/enter">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  if (spaceError || membersError) {
    console.error('Data loading error:', spaceError || membersError);
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-3xl font-headline">Access Denied</h1>
          <p className="mt-2 font-caption text-muted-foreground">You may not have permission to view this space.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/enter">
              <ArrowLeft className="mr-2 h-4 w-4" /> Try Again
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const loggedInMemberIsPresent = membersData?.some(member => member.id === user?.uid);


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
               <Card key={member.id} className="text-center hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group" onClick={() => member.claimed && handleEnterAsMember(member)}>
                 <CardHeader>
                   <CardTitle>{member.displayName}</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <User className="w-16 h-16 mx-auto text-muted-foreground" />
                 </CardContent>
                 <CardFooter>
                   {member.claimed ? (
                     <Button className="w-full" disabled={!user || user.isAnonymous || user.uid !== member.id}>Enter as {member.displayName}</Button>
                   ) : (
                     <Button variant="secondary" className="w-full" onClick={(e) => { e.stopPropagation(); handleClaim(member.id); }}>Claim Account</Button>
                   )}
                 </CardFooter>
               </Card>
             ))}
           </div>

           {!isUserLoading && user && !user.isAnonymous && !loggedInMemberIsPresent && (
             <Card className="mt-8">
                <CardHeader>
                    <CardTitle>You're not a member... yet</CardTitle>
                    <CardDescription>You are signed in as {user.email}, but you aren't a member of this space. You can claim an unclaimed account or ask a member to invite you.</CardDescription>
                </CardHeader>
             </Card>
           )}

            {!isUserLoading && (!user || user.isAnonymous) && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Sign In to Enter</CardTitle>
                        <CardDescription>
                            If you have already claimed an account for this space, please sign in to enter.
                        </CardDescription>
                    </CardHeader>
                    {/* Simplified login suggestion, actual login handled via FirebaseUI or separate login page */}
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link href="/enter">Sign In</Link>
                      </Button>
                    </CardContent>
                </Card>
            )}

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
