'use client';

// This page is not used in the new simplified flow and can be considered deprecated.
// It is left here in case the flow changes back, but it is not linked from anywhere.

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DeprecatedClaimPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background p-4">
      <h1 className="text-3xl font-headline">Page Not In Use</h1>
      <p className="mt-2 font-caption text-muted-foreground">
        This account claiming page is not part of the current simplified user flow.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/enter">Return to Entrance</Link>
      </Button>
    </div>
  );
}
