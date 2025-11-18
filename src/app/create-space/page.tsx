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
import { Users, Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';

export default function CreateSpacePage() {
  const [spaceName, setSpaceName] = useState('');
  const [yourName, setYourName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [spacePassword, setSpacePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleCreateSpace = async () => {
    if (!spaceName || !yourName || !partnerName || !spacePassword) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all fields to create your space.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const slug = spaceName.toLowerCase().replace(/\s+/g, '-');
      const spaceId = slug;

      // In a real app, you would hash the password on a server.
      // For this simplified flow, we store it directly.
      // This is NOT secure for a production app.
      const spacePasswordHash = spacePassword; 
      
      const batch = writeBatch(firestore);

      const spaceRef = doc(firestore, 'spaces', spaceId);
      batch.set(spaceRef, {
        displayName: spaceName,
        slug: slug,
        spacePasswordHash: spacePasswordHash,
        createdAt: new Date().toISOString(),
      });
      
      const yourMemberRef = doc(firestore, `spaces/${spaceId}/members`, yourName.toLowerCase().replace(/\s+/g, '-'));
      batch.set(yourMemberRef, {
        displayName: yourName,
        isClaimed: false, // Simplified flow doesn't use claiming
        profile: {
          avatarUrl: '',
          bio: '',
          mood: '',
          pronouns: ''
        }
      });
      
      const partnerMemberRef = doc(firestore, `spaces/${spaceId}/members`, partnerName.toLowerCase().replace(/\s+/g, '-'));
      batch.set(partnerMemberRef, {
        displayName: partnerName,
        isClaimed: false,
        profile: {
          avatarUrl: '',
          bio: '',
          mood: '',
          pronouns: ''
        }
      });

      await batch.commit();

      toast({
        title: 'Space Created!',
        description: `Your space "${spaceName}" is ready.`,
      });
      router.push(`/enter`);

    } catch (error: any) {
      console.error('Error creating space:', error);
      let errorMessage = 'Could not create the space. Please try again.';
      
      // We check for a more specific permission error message now.
      if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
        errorMessage = 'You do not have permission to create a space. This might be a security rule issue. Please try again or contact support.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
          Create a space
        </h1>
        <p className="mt-3 max-w-lg mx-auto text-muted-foreground font-caption">
          A private place to share, plan, and grow.
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="border-primary/20">
          <CardHeader className="items-center text-center pt-8">
            <div className="bg-primary/10 p-4 rounded-full">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl mt-4">Create a space</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="space-name">Space name</Label>
              <Input
                id="space-name"
                placeholder="e.g., Our Cozy Corner"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                disabled={isLoading}
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="your-name">Your name</Label>
                <Input
                  id="your-name"
                  placeholder="Your name"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-name">Partner name</Label>
                <Input
                  id="partner-name"
                  placeholder="Partner's name"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="space-password">Shared Password</Label>
              <Input
                id="space-password"
                type="password"
                placeholder="A secret password for your space"
                value={spacePassword}
                onChange={(e) => setSpacePassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCreateSpace} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create space'}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Already have a space? <Link href="/enter" className="underline">Enter here</Link>.</p>
        </div>
      </div>
    </div>
  );
}
