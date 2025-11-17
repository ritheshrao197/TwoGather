import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Gift, Images, Archive } from 'lucide-react';

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === 'hero-image');
  const personalPageImage = PlaceHolderImages.find(
    (p) => p.id === 'personal-page-feature'
  );
  const memoryWallImage = PlaceHolderImages.find(
    (p) => p.id === 'memory-wall-feature'
  );
  const sharedArchiveImage = PlaceHolderImages.find(
    (p) => p.id === 'shared-archive-feature'
  );

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <section className="relative w-full h-[60vh] md:h-[80vh]">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="relative h-full flex flex-col items-center justify-end text-center p-4 md:p-8 pb-16 md:pb-24">
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-foreground tracking-tight drop-shadow-lg">
              Your Private World, Together.
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl text-foreground/80 font-caption drop-shadow-md">
              A shared space for two, built on privacy and connection. Create
              personal pages, build a memory wall, and unlock a shared archive.
            </p>
            <Button asChild size="lg" className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/enter">Get Started</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-caption">
                  Key Features
                </div>
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">
                  Crafted for Connection
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-caption">
                  Discover a new way to share your world with one special
                  person, with features designed for privacy and intimacy.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <Card className="hover:shadow-primary/10 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">Personal Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="font-caption mb-4">
                    A private page for each of you, curated by the other. Share
                    wishes, notes, and collections meant only for their eyes.
                  </CardDescription>
                  {personalPageImage && (
                    <Image
                      src={personalPageImage.imageUrl}
                      alt={personalPageImage.description}
                      width={400}
                      height={300}
                      className="rounded-lg object-cover w-full aspect-[4/3]"
                      data-ai-hint={personalPageImage.imageHint}
                    />
                  )}
                </CardContent>
              </Card>
              <Card className="hover:shadow-primary/10 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Images className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">Memory Wall</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="font-caption mb-4">
                    Build a beautiful masonry gallery of your shared moments.
                    Add images, videos, and audio with captions and dates.
                  </CardDescription>
                  {memoryWallImage && (
                    <Image
                      src={memoryWallImage.imageUrl}
                      alt={memoryWallImage.description}
                      width={400}
                      height={300}
                      className="rounded-lg object-cover w-full aspect-[4/3]"
                      data-ai-hint={memoryWallImage.imageHint}
                    />
                  )}
                </CardContent>
              </Card>
              <Card className="hover:shadow-primary/10 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Archive className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">Shared Archive</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="font-caption mb-4">
                    Unlock a shared space when you're both online. Discover a
                    timeline of your journey, an idea board for plans, and fun
                    tools.
                  </CardDescription>
                  {sharedArchiveImage && (
                    <Image
                      src={sharedArchiveImage.imageUrl}
                      alt={sharedArchiveImage.description}
                      width={400}
                      height={300}
                      className="rounded-lg object-cover w-full aspect-[4/3]"
                      data-ai-hint={sharedArchiveImage.imageHint}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-headline font-bold tracking-tighter md:text-4xl/tight">
                Private by Design. Secure by Default.
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-caption">
                Your space is yours alone. We use end-to-end principles for
                security and never look at your data. Your privacy is not the
                product.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
