
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  PlusCircle,
  MessageSquarePlus,
  CheckCircle2,
  ListTodo,
  CalendarPlus,
  Users,
  Sun,
  Smile,
  ImageIcon,
  StickyNote,
  Sparkles,
  Palette,
  Settings,
  Loader2,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddNoteDialog } from '@/components/content/add-note-dialog';
import { useNotes, NoteDocument } from '@/hooks/useNotes';
import { formatDistanceToNow } from 'date-fns';


export default function PersonalSpacePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const spaceSlug = params.spaceSlug as string;

  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);

  // We only fetch notes if the user is loaded and present.
  const {
    data: notes,
    isLoading: notesLoading,
    error: notesError,
  } = useNotes(user ? spaceSlug : '');

  const latestMemoryImages = [
    PlaceHolderImages.find((p) => p.id === 'memory-wall-feature'),
    PlaceHolderImages.find((p) => p.id === 'personal-page-feature'),
    PlaceHolderImages.find((p) => p.id === 'shared-archive-feature'),
    PlaceHolderImages.find((p) => p.id === 'hero-image'),
  ].filter(Boolean);

  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.push(`/space/${spaceSlug}/lobby`);
    }
  }, [user, isUserLoading, router, spaceSlug]);

  // Show a loading screen while we verify the user's authentication state.
  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="mt-4 font-caption text-muted-foreground">Loading your space...</p>
        </main>
      </div>
    );
  }
  
  const renderNote = (note: NoteDocument) => {
    const randomColorClasses = [
      "bg-yellow-200/20",
      "bg-blue-200/20",
      "bg-green-200/20",
      "bg-purple-200/20",
      "bg-pink-200/20",
    ];
    const randomClass = randomColorClasses[note.id.charCodeAt(0) % randomColorClasses.length];

    return (
        <div key={note.id} className={`${randomClass} p-4 rounded-lg text-sm font-caption flex flex-col justify-between`}>
            <p className="flex-grow">{note.payload.text}</p>
            <p className="text-xs text-muted-foreground mt-2 text-right">
                {note.createdAt?.toDate ? formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true }) : 'just now'}
            </p>
        </div>
    );
  };


  return (
    <>
      <AddNoteDialog
        spaceId={spaceSlug}
        open={isAddNoteDialogOpen}
        onOpenChange={setIsAddNoteDialogOpen}
      />
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          {/* 1. Space Header */}
          <section className="mb-8">
            <h1 className="text-4xl font-headline font-bold text-foreground capitalize">
              {spaceSlug.replace(/-/g, ' ')}
            </h1>
            <p className="text-muted-foreground font-caption">
              This is your shared space.
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Signed in as: {user.displayName || user.email}</span>
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                You&apos;re online
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                Partner last seen 2 hours ago
              </div>
            </div>
          </section>

          {/* 2. Quick Action Bar */}
          <section className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <Button variant="outline"><PlusCircle /> Add Memory</Button>
              <Button variant="outline" onClick={() => setIsAddNoteDialogOpen(true)}><MessageSquarePlus /> Leave a Note</Button>
              <Button variant="outline"><CheckCircle2 /> Check-in Today</Button>
              <Button variant="outline"><ListTodo /> Add Shared Task</Button>
              <Button variant="outline"><CalendarPlus /> Add Shared Event</Button>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* 3. Activity Highlights */}
              <Card>
                <CardHeader><CardTitle>Activity Highlights</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm font-caption text-muted-foreground">
                    <li>- You added a memory yesterday.</li>
                    <li>- Partner updated the agreements board.</li>
                    <li>- 3 new notes added this week.</li>
                  </ul>
                </CardContent>
              </Card>

              {/* 5. Latest Memories */}
              <Card>
                <CardHeader><CardTitle>Latest Memories</CardTitle></CardHeader>
                <CardContent>
                  <Carousel className="w-full">
                    <CarouselContent>
                      {latestMemoryImages.map((img, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                          <div className="p-1">
                            {img && <Image
                                src={img.imageUrl}
                                alt={img.description}
                                width={400}
                                height={300}
                                className="rounded-lg object-cover w-full aspect-square"
                                data-ai-hint={img.imageHint}
                              />}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="ml-12"/>
                    <CarouselNext className="mr-12" />
                  </Carousel>
                </CardContent>
              </Card>

              {/* 6. Notes / Appreciation */}
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Notes & Appreciation</CardTitle>
                  <Button variant="secondary" size="sm" onClick={() => setIsAddNoteDialogOpen(true)}>
                    <StickyNote /> Write a Quick Note
                  </Button>
                </CardHeader>
                <CardContent>
                    {notesLoading && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-muted p-4 rounded-lg h-24 animate-pulse"></div>
                        <div className="bg-muted p-4 rounded-lg h-24 animate-pulse"></div>
                        <div className="bg-muted p-4 rounded-lg h-24 animate-pulse"></div>
                      </div>
                    )}
                    {notesError && <p className="text-destructive font-caption text-sm">Could not load notes. You may not have permission to view them.</p>}
                    {!notesLoading && !notesError && notes && notes.length > 0 && (
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         {notes.map(renderNote)}
                       </div>
                    )}
                    {!notesLoading && !notesError && (!notes || notes.length === 0) && (
                       <p className="text-muted-foreground font-caption text-sm text-center py-4">No notes yet. Why not leave the first one?</p>
                    )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              {/* 4. Daily Check-in */}
              <Card>
                <CardHeader><CardTitle>Daily Check-in</CardTitle></CardHeader>
                <CardContent>
                  <p className="font-caption text-sm mb-2">How are you feeling today?</p>
                  <div className="flex gap-2">
                    <Input placeholder="1 emoji + 1-line note" />
                    <Button>Save</Button>
                  </div>
                  <Separator className="my-4"/>
                  <p className="font-caption text-sm text-muted-foreground">Partner's last check-in:</p>
                  <p className="font-caption text-sm">😊 Feeling great today!</p>
                </CardContent>
              </Card>

              {/* 11. Quick Navigation Tiles */}
              <Card>
                  <CardHeader><CardTitle>Explore Your Space</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-center">
                      <Link href="#" className="p-4 rounded-lg bg-muted hover:bg-primary/10 transition-colors">
                          <ImageIcon className="mx-auto mb-2" />
                          <span className="text-sm font-caption">Memory Wall</span>
                      </Link>
                      <Link href="#" className="p-4 rounded-lg bg-muted hover:bg-primary/10 transition-colors">
                          <StickyNote className="mx-auto mb-2" />
                          <span className="text-sm font-caption">Notes Board</span>
                      </Link>
                      <Link href="#" className="p-4 rounded-lg bg-muted hover:bg-primary/10 transition-colors">
                          <Sparkles className="mx-auto mb-2" />
                          <span className="text-sm font-caption">Agreements</span>
                      </Link>
                      <Link href="#" className="p-4 rounded-lg bg-muted hover:bg-primary/10 transition-colors">
                          <Users className="mx-auto mb-2" />
                          <span className="text-sm font-caption">Public Page</span>
                      </Link>
                  </CardContent>
              </Card>

              {/* 10. Space Customization */}
              <Card>
                <CardHeader><CardTitle>Space Customization</CardTitle></CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full"><Palette className="mr-2"/> Edit Theme & Style</Button>
                </CardContent>
              </Card>
              
            </div>
          </div>

          <div className="mt-8 text-center">
              <Button asChild variant="outline">
                  <Link href={`/space/${spaceSlug}/lobby`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Lobby
                  </Link>
              </Button>
          </div>
        </main>
      </div>
    </>
  );
}
