
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, KeyRound, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFirebase, useMemoFirebase, useCollection, useDoc, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';

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

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberPassword, setMemberPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // This effect handles the initial authentication check.
  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // User is already logged in.
        setIsAuthenticated(true);
      } else {
        // No user, but we need to authenticate to read from Firestore.
        // We'll sign in anonymously to satisfy security rules for public reads.
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

  // Memoize Firestore references. Only create them if we are authenticated and have a slug.
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

  const handleMemberLogin = () => {
    if (!selectedMember || !memberPassword) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please select a member and enter a password.'
      });
      return;
    }
    toast({
      title: 'Login Successful!',
      description: `Welcome, ${selectedMember}!`
    });
    router.push(`/space/${spaceSlug}`);
  };

  const handleClaim = (memberName: string) => {
    toast({
      title: 'Claim Your Account',
      description: `Redirecting ${memberName} to the account claim page...`
    });
    router.push(`/claim?space=${spaceSlug}&member=${memberName}`);
  };

  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please enter your email and password.'
      });
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({
        title: 'Login Successful!',
        description: 'You are now signed in.',
      });
      setShowLogin(false);
    } catch (error: any) {
      console.error('Email login error:', error);
      let errorMessage = 'Failed to log in. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'No account found with this email or password.';
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage
      });
    }
  };

  const isLoading = spaceLoading || membersLoading || !isAuthenticated;

  // Show a loading state while we check auth and fetch initial data.
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

  // After loading, if the user is authenticated but the space doesn't exist.
  if (isAuthenticated && !spaceData) {
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

  // If there's a specific error loading data (e.g., permissions)
  if (spaceError || membersError) {
    console.error('Data loading error:', spaceError || membersError);
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-3xl font-headline">Access Denied</h1>
          <p className="mt-2 font-caption text-muted-foreground">You may not have permission to view this space.</p>
          <p className="mt-1 font-caption text-sm text-muted-foreground/80">Please ensure you've entered the correct space password.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/enter">
              <ArrowLeft className="mr-2 h-4 w-4" /> Try Again
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
          {user && !user.isAnonymous ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {(membersData || []).map((member) => (
               <Card key={member.id} className="text-center">
                 <CardHeader>
                   <CardTitle>{member.displayName}</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <User className="w-16 h-16 mx-auto text-muted-foreground" />
                 </CardContent>
                 <CardFooter>
                   {member.claimed ? (
                     <Button className="w-full" onClick={() => router.push(`/space/${spaceSlug}`)}>Enter as {member.displayName}</Button>
                   ) : (
                     <Button variant="secondary" className="w-full" onClick={() => handleClaim(member.displayName)}>Claim Account</Button>
                   )}
                 </CardFooter>
               </Card>
             ))}
           </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Please sign in with your email to access this space.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleEmailLogin}>Sign In</Button>
              </CardFooter>
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
