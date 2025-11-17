'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PersonalSpacePage() {
  const params = useParams();
  const person = params.person as string;

  if (!person) {
    return null;
  }

  const personName = person.toUpperCase();
  const creatorName = personName === 'A' ? 'B' : 'A';

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
          Welcome to {personName}'s Space
        </h1>
        <p className="mt-3 max-w-md mx-auto text-muted-foreground font-caption">
          This is a private area curated for you by Person {creatorName}.
        </p>
        
        <div className="mt-12 w-full max-w-3xl border rounded-lg p-8">
            <h2 className="text-2xl font-headline">Content for {personName} appears here.</h2>
        </div>

        <Button asChild variant="outline" className="mt-12">
            <Link href="/enter">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Entrance
            </Link>
        </Button>
      </main>
    </div>
  );
}
