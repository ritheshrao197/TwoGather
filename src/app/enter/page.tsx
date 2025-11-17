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
import { KeyRound, Users, Loader2 } from 'lucide-react';
import { verifySpacePassword } from '@/actions/auth';

export default function EnterPage() {
  const [spaceSlug, setSpaceSlug] = useState('');
  const [spacePassword, setSpacePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
      const result = await verifySpacePassword({ spaceSlug, spacePassword });
      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Entering the lobby...',
        });
        // Store a token in session storage to prove we've entered the password
        sessionStorage.setItem(`space-auth-${spaceSlug}`, 'true');
        router.push(`/space/${spaceSlug}/lobby`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: result.error || 'The space name or password may be incorrect.',
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error verifying space password:', error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Could not verify space password. Please try again.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
          Enter Your Shared Space
        </h1>
        <p className="mt-3 max-w-md mx-auto text-muted-foreground font-caption">
          Enter the name and password for your space to access the lobby.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <Card className="border-primary/20">
          <CardHeader className="items-center text-center pt-8">
            <div className="bg-primary/10 p-4 rounded-full">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl mt-4">Space Lobby</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="space-slug">Space Name</Label>
              <Input
                id="space-slug"
                type="text"
                placeholder="our-special-place"
                value={spaceSlug}
                onChange={(e) => setSpaceSlug(e.target.value.toLowerCase().replace(/\\s+/g, '-'))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="space-password">Space Password</Label>
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
              {isLoading ? <Loader2 className="animate-spin" /> : 'Enter Lobby'}
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