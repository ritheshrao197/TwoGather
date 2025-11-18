import Link from 'next/link';
import { Mountain } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-transparent text-foreground absolute top-0 left-0 right-0 z-20">
      <Link href="/" className="flex items-center justify-center" prefetch={false}>
        <div className="flex flex-col">
          <span className="text-lg font-headline">Between us</span>
          <span className="text-xs font-caption">A private place to share, plan, and grow.</span>
        </div>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Link
          href="/enter"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'border-primary/50 text-foreground hover:bg-primary/10 hover:text-foreground'
          )}
        >
          Enter Space
        </Link>
      </nav>
    </header>
  );
}
