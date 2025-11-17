"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Users } from 'lucide-react';

export default function EnterPage() {
  const [spaceSlug, setSpaceSlug] = useState('');
  const [spacePassword, setSpacePassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleEnterLobby = () => {
    // TODO: Verify space slug and password against Firebase
    if (spaceSlug && spacePassword) {
      router.push(`/space/${spaceSlug}/lobby`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please provide a space name and password.',
      });
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
            <CardTitle className="font-headline text-2xl mt-4">
              Space Lobby
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="space-slug">Space Name</Label>
              <Input
                id="space-slug"
                type="text"
                placeholder="our-special-place"
                value={spaceSlug}
                onChange={(e) => setSpaceSlug(e.target.value)}
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
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleEnterLobby}>
              Enter Lobby
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
