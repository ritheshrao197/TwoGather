import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <path d="M14.5 14.5c-2.4 2.4-3.5 3.5-5 5-2.2-2.2-2.2-5.8 0-8 .9-.9 1.5-2.1 1.5-3.5C11 5 9.5 3 7.5 3c-1 .01-2 .5-2.5 1" />
    <path d="M18 10c-2.2 0-4-1.8-4-4" />
  </svg>
);

export default function EnterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
          Welcome to Your Space
        </h1>
        <p className="mt-3 max-w-md mx-auto text-muted-foreground font-caption">
          Choose your side to enter. Each space is protected by a unique access key.
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="flex flex-col border-primary/20 hover:border-primary/50 transition-colors duration-300">
          <CardHeader className="items-center text-center pt-8">
            <PersonAIcon />
            <CardTitle className="font-headline text-2xl mt-4">For Person A</CardTitle>
            <CardDescription className="font-caption">
              This space is curated for you by Person B.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-2">
              <Label htmlFor="password-a">Access Key</Label>
              <Input id="password-a" type="password" placeholder="••••••••" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Open A's Space</Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col border-primary/20 hover:border-primary/50 transition-colors duration-300">
          <CardHeader className="items-center text-center pt-8">
            <PersonBIcon />
            <CardTitle className="font-headline text-2xl mt-4">For Person B</CardTitle>
            <CardDescription className="font-caption">
              This space is curated for you by Person A.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-2">
              <Label htmlFor="password-b">Access Key</Label>
              <Input id="password-b" type="password" placeholder="••••••••" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Open B's Space</Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground font-caption">
            Don't have a space yet?{' '}
            <Link href="#" className="font-medium text-accent hover:text-accent/80 underline underline-offset-4">
              Create a shared space
            </Link>
          </p>
        </div>
    </div>
  );
}
