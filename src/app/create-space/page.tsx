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

export default function CreateSpacePage() {
  const [spaceName, setSpaceName] = useState('');
  const [yourName, setYourName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [spacePassword, setSpacePassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateSpace = async () => {
    if (!spaceName || !yourName || !partnerName || !spacePassword) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all fields to create your space.',
      });
      return;
    }
    // TODO: Implement actual space creation logic with Firebase
    const slug = spaceName.toLowerCase().replace(/\s+/g, '-');
    toast({
      title: 'Space Created!',
      description: `Your space "${spaceName}" is ready.`,
    });
    router.push(`/space/${slug}/lobby`);
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-name">Partner's Name</Label>
                <Input
                  id="partner-name"
                  placeholder="Partner's name"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
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
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCreateSpace}>
              Create Space
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
