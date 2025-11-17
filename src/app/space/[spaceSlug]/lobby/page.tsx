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
import { ArrowLeft, User, KeyRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFirebase, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

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
  const spaceSlug = params.spaceSlug as string;

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberPassword, setMemberPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // Authenticate the user anonymously when the component mounts
  useEffect(() => {
    const authenticateUser = async () => {
      try {
        // Sign in anonymously to get permissions to read Firestore data
        await signInAnonymously(auth);
        setIsAuthenticating(false);
      } catch (error) {
        console.error('Error signing in anonymously:', error);
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Failed to authenticate. Please try again.',
        });
        setIsAuthenticating(false);
      }
    };

    authenticateUser();
  }, [auth, toast]);

  // Create memoized references for Firestore queries
  const memoizedSpaceRef = useMemoFirebase(
    () => doc(firestore, 'spaces', spaceSlug),
    [firestore, spaceSlug]
  );

  const memoizedMembersRef = useMemoFirebase(
    () => collection(firestore, 'spaces', spaceSlug, 'members'),
    [firestore, spaceSlug]
  );

  // Use the Firebase hooks to fetch data
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
  
  // Handle authentication state
  if (isAuthenticating) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold">Authenticating...</h1>
        </main>
      </div>
    );
  }

  // Handle loading states
  if (spaceLoading || membersLoading) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </main>
      </div>
    );
  }

  // Handle error states
  if (spaceError || membersError) {
    console.error('Error fetching data:', spaceError || membersError);
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold">Error loading space data.</h1>
          <Button asChild variant="link" className="mt-4">
            <Link href="/enter">Return to entrance</Link>
          </Button>
        </main>
      </div>
    );
  }

  // Handle case where space doesn't exist
  if (!spaceData) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold">Space not found.</h1>
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