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
  slug: string;
  spacePasswordHash: string;
  publicEnabled: boolean;
  createdAt: string;
}

interface MemberData {
  displayName: string;
  claimed: boolean;
  lastSeen?: string;
  createdAt: string;
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
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // When component mounts, if no user is found after loading, we'll wait for explicit login
  useEffect(() => {
    if (!isUserLoading) {
      // If we have a user, we're done with auth
      if (user) {
        setIsAuthenticating(false);
      } else {
        // If no user, show login form instead of auto-signing in anonymously
        setIsAuthenticating(false);
      }
    }
  }, [isUserLoading, user]);

  // Memoize Firestore references. Only create them if we have a user and a space slug.
  const memoizedSpaceRef = useMemoFirebase(
    () => (user && spaceSlug ? doc(firestore, 'spaces', spaceSlug) : null),
    [user, firestore, spaceSlug]
  );

  const memoizedMembersRef = useMemoFirebase(
    () => (user && spaceSlug ? collection(firestore, 'spaces', spaceSlug, 'members') : null),
    [user, firestore, spaceSlug]
  );

  // Use the Firebase hooks to fetch data. These hooks will wait until the refs are not null.
  const {
    data: spaceData,
    isLoading: spaceLoading,
    error: spaceError
  } = useDoc<SpaceData>(memoizedSpaceRef);

  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError
  } = useCollection<MemberData>(memoizedMembersRef);

  const handleMemberLogin = () => {
    if (!selectedMember || !memberPassword) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please select a member and enter a password.',
      });
      return;
    }
    // TODO: Authenticate member with Firebase
    toast({
      title: 'Login Successful!',
      description: `Welcome, ${selectedMember}!`,
    });
    router.push(`/space/${spaceSlug}`);
  };

  const handleClaim = (memberName: string) => {
    // TODO: Navigate to claim flow
    toast({
      title: 'Claim Your Account',
      description: `Redirecting ${memberName} to the account claim page...`,
    });
    router.push(`/claim?space=${spaceSlug}&member=${memberName}`);
  };

  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please enter your email and password.',
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({
        title: 'Login Successful!',
        description: 'You have been logged in successfully.',
      });
      setShowLogin(false);
    } catch (error: any) {
      console.error('Email login error:', error);
      let errorMessage = 'Failed to log in. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please provide a valid email address.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    }
  };

  // Show a loading state while authenticating or fetching initial data.
  const isLoading = isAuthenticating || spaceLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h1 className="text-2xl font-bold font-headline">
            {isAuthenticating ? 'Authenticating...' : 'Loading Space...'}
          </h1>
        </main>
      </div>
    );
  }

  // If no user and not showing login form, show option to login
  if (!user && !showLogin) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-full max-w-sm">
            <Card className="border-primary/20">
              <CardHeader className="items-center text-center pt-8">
                <div className="bg-primary/10 p-4 rounded-full">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">Account Required</CardTitle>
                <CardDescription>
                  This space was created with an email account. Please log in to access it.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" onClick={() => setShowLogin(true)}>
                  Log in with Email
                </Button>
                <Button asChild variant="link" className="w-full">
                  <Link href="/enter">Return to entrance</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // If no user but showing login form, show login form
  if (!user && showLogin) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-full max-w-sm">
            <Card className="border-primary/20">
              <CardHeader className="items-center text-center pt-8">
                <div className="bg-primary/10 p-4 rounded-full">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">Log in to Your Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEmailLogin();
                      }
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" onClick={handleEmailLogin}>
                  Log In
                </Button>
                <Button variant="link" className="w-full" onClick={() => setShowLogin(false)}>
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Handle error states
  if (spaceError || membersError) {
    console.error('Error fetching data:', spaceError || membersError);
    
    // Check if it's a permission error
    const isPermissionError = (spaceError && spaceError.message && spaceError.message.includes('Missing or insufficient permissions')) || 
                             (membersError && membersError.message && membersError.message.includes('Missing or insufficient permissions'));
    
    if (isPermissionError) {
      return (
        <div className="flex flex-col min-h-dvh bg-background text-foreground">
          <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              You don't have permission to access this space. This could be because:
            </p>
            <ul className="text-muted-foreground mt-2 text-left list-disc pl-5 max-w-md">
              <li>You're not logged in with the correct account</li>
              <li>You're not a member of this space</li>
              <li>The space was created with a different authentication method</li>
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild>
                <Link href="/enter">Return to entrance</Link>
              </Button>
              <Button variant="outline" onClick={() => setShowLogin(true)}>
                Try logging in with a different account
              </Button>
            </div>
          </main>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold">Error loading space data.</h1>
          <p className="text-muted-foreground mt-2">An unexpected error occurred while loading the space.</p>
          <Button asChild variant="link" className="mt-4">
            <Link href="/enter">Return to entrance</Link>
          </Button>
        </main>
      </div>
    );
  }

  // Handle case where space doesn't exist after loading
  if (!spaceData) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold">Space not found.</h1>
          <p className="text-muted-foreground mt-2">Please check the name and try again.</p>
          <Button asChild variant="link" className="mt-4">
            <Link href="/enter">Return to entrance</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
            Welcome to {spaceData.displayName || 'Unnamed Space'}
          </h1>
          <p className="mt-3 max-w-md mx-auto text-muted-foreground font-caption">
            Who is entering?
          </p>
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {membersData && membersData.map((member) => (
            <Card
              key={member.id}
              className={`transition-all duration-300 ${
                selectedMember === member.displayName ? 'border-primary shadow-lg' : 'border-primary/20'
              }`}
            >
              <CardHeader className="items-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">{member.displayName || 'Unnamed Member'}</CardTitle>
                <CardDescription>
                  {member.claimed ? 'Account Claimed' : 'Claim Your Account'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {member.claimed ? (
                  <Button
                    className="w-full"
                    variant={selectedMember === member.displayName ? 'default' : 'outline'}
                    onClick={() => setSelectedMember(member.displayName)}
                  >
                    Log in as {member.displayName}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleClaim(member.displayName)}>
                    Claim Account
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedMember && (
          <div className="w-full max-w-sm mt-12">
            <Card className="border-accent/30">
              <CardHeader className="items-center text-center">
                 <div className="bg-accent/10 p-3 rounded-full">
                    <KeyRound className="w-6 h-6 text-accent" />
                 </div>
                <CardTitle className="text-xl font-headline">Enter Password for {selectedMember}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member-password">Your Password</Label>
                  <Input
                    id="member-password"
                    type="password"
                    placeholder="••••••••"
                    value={memberPassword}
                    onChange={(e) => setMemberPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMemberLogin()}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleMemberLogin}>
                  Login
                </Button>
                 <Button variant="link" size="sm" onClick={() => setSelectedMember(null)}>
                    Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <Button asChild variant="outline" className="mt-16">
            <Link href="/enter">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Space Entrance
            </Link>
        </Button>
      </main>
    </div>
  );
}