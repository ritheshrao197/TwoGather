'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { UserCheck, Loader2 } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, writeBatch, collection, query, where } from 'firebase/firestore';

interface MemberData {
  id: string;
  displayName: string;
  claimed: boolean;
}

function ClaimPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  const spaceId = searchParams.get('space');
  const memberId = searchParams.get('memberId');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [isCheckingMember, setIsCheckingMember] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!firestore || !spaceId || !memberId) {
        setIsCheckingMember(false);
        return;
      }
      try {
        const memberRef = doc(firestore, `spaces/${spaceId}/members/${memberId}`);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          const data = memberSnap.data() as Omit<MemberData, 'id'>;
          if (data.claimed) {
            toast({
              variant: 'destructive',
              title: 'Account Already Claimed',
              description: 'This account has already been claimed. Please sign in instead.',
            });
            router.push(`/space/${spaceId}/lobby`);
          } else {
            setMemberData({ ...data, id: memberSnap.id });
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Invalid Claim Link',
            description: 'The member you are trying to claim does not exist.',
          });
          router.push('/enter');
        }
      } catch (error) {
        console.error('Error fetching member data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not verify claim details. Please try again.',
        });
      } finally {
        setIsCheckingMember(false);
      }
    };
    fetchMemberData();
  }, [firestore, spaceId, memberId, toast, router]);

  const handleClaimAccount = async () => {
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide an email and password.',
      });
      return;
    }
    if (!memberData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot claim account without valid member data.' });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create a new Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUserId = userCredential.user.uid;

      // 2. Update their profile
      await updateProfile(userCredential.user, {
        displayName: memberData.displayName,
      });

      // 3. Atomically update Firestore
      const batch = writeBatch(firestore);

      // 3a. Get the old, unclaimed member document
      const oldMemberRef = doc(firestore, `spaces/${spaceId}/members/${memberData.id}`);

      // 3b. Create a new member document with the new user's UID
      const newMemberRef = doc(firestore, `spaces/${spaceId}/members/${newUserId}`);
      batch.set(newMemberRef, {
        ...memberData,
        claimed: true,
        lastSeen: new Date().toISOString(),
      });
      
      // 3c. Delete the old, unclaimed member document
      batch.delete(oldMemberRef);

      await batch.commit();

      toast({
        title: 'Account Claimed!',
        description: `Welcome, ${memberData.displayName}! You can now enter the space.`,
      });
      router.push(`/space/${spaceId}/lobby`);

    } catch (error: any) {
      console.error('Error claiming account:', error);
      let errorMessage = 'Could not claim your account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already taken. Please use a different one.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Your password must be at least 6 characters long.';
      }
      toast({ variant: 'destructive', title: 'Claim Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingMember || !spaceId || !memberId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-background p-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="mt-4 font-caption text-muted-foreground">Verifying your claim link...</p>
      </div>
    );
  }
  
  if (!memberData) {
     return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-background p-4">
        <h1 className="text-3xl font-headline">Invalid Claim Link</h1>
        <p className="mt-2 font-caption text-muted-foreground">This claim link is either invalid or has expired.</p>
        <Button asChild variant="outline" className="mt-6">
            <Link href="/enter">
              Return to Entrance
            </Link>
          </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background p-4">
       <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
          Claim Your Account
        </h1>
        <p className="mt-3 max-w-md mx-auto text-muted-foreground font-caption">
          Welcome, {memberData.displayName}! Create your private login to access the space.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center pt-8">
            <div className="bg-primary/10 p-4 rounded-full">
              <UserCheck className="w-8 h-8 text-primary" />
            </div>
          <CardTitle>Create Your Login</CardTitle>
          <CardDescription>for {memberData.displayName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Choose a Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleClaimAccount} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : 'Claim My Account'}
          </Button>
        </CardFooter>
      </Card>
       <Button asChild variant="link" className="mt-6">
            <Link href={`/space/${spaceId}/lobby`}>
              Back to Lobby
            </Link>
        </Button>
    </div>
  );
}


export default function ClaimPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ClaimPageContent />
        </Suspense>
    )
}
