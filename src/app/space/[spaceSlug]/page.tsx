'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';

export default function PersonalSpacePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const spaceSlug = params.spaceSlug as string;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/enter');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
        <div className="flex flex-col min-h-dvh bg-background text-foreground">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <p>Loading...</p>
            </main>
        </div>
    )
  }
  
  if (!spaceSlug) {
    return null;
  }


  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
          Space: {spaceSlug}
        </h1>
        <p className="mt-3 max-w-md mx-auto text-muted-foreground font-caption">
          This is your shared space.
        </p>
        <p className="text-sm mt-2">Signed in as: {user.email}</p>
        
        <div className="mt-12 w-full max-w-3xl border rounded-lg p-8">
            <h2 className="text-2xl font-headline">Shared content appears here.</h2>
        </div>

        <Button asChild variant="outline" className="mt-12">
            <Link href={`/space/${spaceSlug}/lobby`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lobby
            </Link>
        </Button>
      </main>
    </div>
  );
}
