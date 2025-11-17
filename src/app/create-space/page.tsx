'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Users } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';

export default function CreateSpacePage() {
  const [spaceName, setSpaceName] = useState('');
  const [yourName, setYourName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [spacePassword, setSpacePassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  const handleCreateSpace = async () => {
    if (!spaceName || !yourName || !partnerName || !spacePassword || !email || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all fields to create your space.',
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create user with email and password and sign them in.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const creatorUid = userCredential.user.uid;
      
      // 2. Update user's auth profile with display name.
      await updateProfile(userCredential.user, {
        displayName: yourName
      });
      
      const slug = spaceName.toLowerCase().replace(/\s+/g, '-');
      const spaceId = slug;
      const partnerId = `partner-${Date.now()}`;

      // 3. Create the space and both member documents in a single atomic batch.
      const batch = writeBatch(firestore);

      const spaceRef = doc(firestore, 'spaces', spaceId);
      batch.set(spaceRef, {
        displayName: spaceName,
        slug: slug,
        spacePasswordHash: spacePassword, // In a real app, you'd hash this.
        publicEnabled: false,
        createdAt: new Date().toISOString(),
      });
      
      const creatorMemberRef = doc(firestore, `spaces/${spaceId}/members`, creatorUid);
      batch.set(creatorMemberRef, {
        displayName: yourName,
        claimed: true,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      
      const partnerMemberRef = doc(firestore, `spaces/${spaceId}/members`, partnerId);
      batch.set(partnerMemberRef, {
        displayName: partnerName,
        claimed: false,
        createdAt: new Date().toISOString(),
      });

      await batch.commit();

      toast({
        title: 'Space Created!',
        description: `Your space "${spaceName}" is ready.`,
      });
      router.push(`/space/${slug}/lobby`);

    } catch (error: any) {
      console.error('Error creating space:', error);
      let errorMessage = 'Could not create the space. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use. Please use a different email or sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please provide a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.message && error.message.includes('Missing or insufficient permissions')) {
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
          Create Your New Shared Space
        </h1>
        <p className="mt-3 max-w-lg mx-auto text-muted-foreground font-caption">
          A private world for just the two of you. Fill in the details below to get started.
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="border-primary/20">
          <CardHeader className="items-center text-center pt-8">
            <div className="bg-primary/10 p-4 rounded-full">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl mt-4">New Space Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="space-name">Space Name</Label>
              <Input
                id="space-name"
                placeholder="e.g., Our Cozy Corner"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Your Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="your-name">Your Name</Label>
                <Input
                  id="your-name"
                  placeholder="Your name"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-name">Partner's Name</Label>
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
              <Label htmlFor="space-password">Shared Space Password</Label>
              <Input
                id="space-password"
                type="password"
                placeholder="A secret password for your space lobby"
                value={spacePassword}
                onChange={(e) => setSpacePassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCreateSpace} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Space'}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>This creates your account, your partner will claim theirs on the next screen.</p>
        </div>
      </div>
    </div>
  );
}
