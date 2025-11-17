import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mountain } from 'lucide-react';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-transparent text-foreground absolute top-0 left-0 right-0 z-20">
      <Link href="/" className="flex items-center justify-center" prefetch={false}>
        <Mountain className="h-6 w-6 text-primary" />
        <span className="sr-only">Shared Spaces</span>
        <span className="ml-3 text-lg font-headline">Shared Spaces</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Button asChild variant="outline" className="border-primary/50 text-foreground hover:bg-primary/10 hover:text-foreground">
          <Link href="/enter">Enter Space</Link>
        </Button>
      </nav>
    </header>
  );
}
