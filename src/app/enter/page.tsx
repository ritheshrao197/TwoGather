'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { KeyRound, Loader2 } from 'lucide-react';
import { verifySpacePassword } from '@/actions/auth';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';


export default function EnterPage() {
  const [spaceSlug, setSpaceSlug] = useState('');
  const [spacePassword, setSpacePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleEnterLobby = async () => {
    if (!spaceSlug || !spacePassword) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please provide a space name and password.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const spaceRef = doc(firestore, 'spaces', spaceSlug);
      const spaceSnap = await getDoc(spaceRef);

      if (!spaceSnap.exists()) {
        toast({ variant: 'destructive', title: 'Not Found', description: 'This space does not exist.' });
        setIsLoading(false);
        return;
      }
      
      const spaceData = spaceSnap.data();

      // In a real app, this check would happen on a server against a hashed password.
      // This is NOT a secure way to check a password.
      if (spaceData.spacePasswordHash !== spacePassword) {
         toast({ variant: 'destructive', title: 'Access Denied', description: 'The password for this space is incorrect.' });
         setIsLoading(false);
         return;
      }

      // If password is correct, redirect to the lobby
      router.push(`/space/${spaceSlug}/lobby`);

    } catch (error) {
       console.error("Error verifying space password:", error);
       toast({ variant: 'destructive', title: 'Error', description: 'Could not verify space details. Please try again.' });
       setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
          Enter a space
        </h1>
        <p className="mt-3 max-w-md mx-auto text-muted-foreground font-caption">
          A private place to share, plan, and grow.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <Card className="border-primary/20">
          <CardHeader className="items-center text-center pt-8">
            <div className="bg-primary/10 p-4 rounded-full">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl mt-4">Enter a space</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="space-slug">Space name</Label>
              <Input
                id="space-slug"
                type="text"
                placeholder="our-special-place"
                value={spaceSlug}
                onChange={(e) => setSpaceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="space-password">Shared Password</Label>
              <Input
                id="space-password"
                type="password"
                placeholder="••••••••"
                value={spacePassword}
                onChange={(e) => setSpacePassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEnterLobby();
                  }
                }}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleEnterLobby} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Enter'}
            </Button>
            <p className="text-sm text-muted-foreground font-caption">
              Don't have a space yet?{' '}
              <Link
                href="/create-space"
                className="font-medium text-accent hover:text-accent/80 underline underline-offset-4"
              >
                Create one now
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
