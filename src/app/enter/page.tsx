"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const PersonAIcon = () => (
  <svg
    className="w-16 h-16 text-primary"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 11v8a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-8" />
    <path d="M12 11V3" />
    <path d="M9 5l3-2 3 2" />
  </svg>
);

const PersonBIcon = () => (
  <svg
    className="w-16 h-16 text-primary"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 14.5c-2.4 2.4-3.5 3.5-5 5-2.2-2.2-2.2-5.8 0-8 .9-.9 1.5-2.1 1.5-3.5C11 5 9.5 3c-1.5 0-2.5 1-2.5 1" />
    <path d="M18 10c-2.2 0-4-1.8-4-4" />
  </svg>
);


export default function EnterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleAuthAction = async (side: 'a' | 'b') => {
    try {
      if (isSigningUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: "Account Created",
          description: "You can now sign in.",
        });
        setIsSigningUp(false); // Switch to sign-in mode
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.push(`/space/${side}`);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
          Welcome to Your Space
        </h1>
        <p className="mt-3 max-w-md mx-auto text-muted-foreground font-caption">
          {isSigningUp ? 'Create a new shared space account.' : 'Sign in to access your personal space.'}
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="border-primary/20">
          <CardHeader className="items-center text-center pt-8">
            <div className="flex gap-4">
              <PersonAIcon />
              <PersonBIcon />
            </div>
            <CardTitle className="font-headline text-2xl mt-4">
              {isSigningUp ? 'Create Account' : 'Enter Your Space'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Default to side 'a' for Enter key press for simplicity
                    handleAuthAction('a');
                  }
                }}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {isSigningUp ? (
              <Button className="w-full" onClick={() => handleAuthAction('a')}>
                Sign Up
              </Button>
            ) : (
              <div className="w-full grid grid-cols-2 gap-4">
                <Button className="w-full" onClick={() => handleAuthAction('a')}>
                  Enter A's Space
                </Button>
                <Button className="w-full" onClick={() => handleAuthAction('b')}>
                  Enter B's Space
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground font-caption">
              {isSigningUp ? 'Already have an account? ' : "Don't have a space yet? "}
              <button
                onClick={() => setIsSigningUp(!isSigningUp)}
                className="font-medium text-accent hover:text-accent/80 underline underline-offset-4"
              >
                {isSigningUp ? 'Sign In' : 'Create a shared space'}
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
