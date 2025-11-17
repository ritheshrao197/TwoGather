
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Cloudy,
  Sunset,
  Sparkles,
  Heart,
  MessageCircle,
  Wind,
  Droplets,
  Flower2,
  CalendarHeart,
  Smile,
  Pen,
  ChevronRight,
  Plus,
  Palette,
  Bell,
} from 'lucide-react';
import { AddNoteDialog } from '@/components/content/add-note-dialog';
import { useNotes, NoteDocument } from '@/hooks/useNotes';
import { formatDistanceToNow } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';

export default function PersonalSpacePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const spaceSlug = params.spaceSlug as string;
  const { data: notes, isLoading: notesLoading } = useNotes(user ? spaceSlug : '');

  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome back.');
  const [welcomeIcon, setWelcomeIcon] = useState(<Sun className="w-5 h-5" />);

  const memoryOfTheDayImage = PlaceHolderImages.find((p) => p.id === 'memory-wall-feature');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/space/${spaceSlug}/lobby`);
    }
  }, [user, isUserLoading, router, spaceSlug]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setWelcomeMessage('Good morning. Hope today feels calm and bright.');
      setWelcomeIcon(<Sun className="w-5 h-5 text-yellow-400" />);
    } else if (hour < 18) {
      setWelcomeMessage('Hope your day is going smoothly.');
      setWelcomeIcon(<Cloudy className="w-5 h-5 text-sky-400" />);
    } else if (hour < 21) {
      setWelcomeMessage('Slow down. You made it through the day.');
      setWelcomeIcon(<Sunset className="w-5 h-5 text-orange-400" />);
    } else {
      setWelcomeMessage('Rest well. This space is here whenever you need it.');
      setWelcomeIcon(<Moon className="w-5 h-5 text-indigo-400" />);
    }
  }, []);

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col min-h-dvh bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 font-caption text-muted-foreground">Waking up your space...</p>
          </div>
        </main>
      </div>
    );
  }

  const renderNote = (note: NoteDocument) => {
    const randomColorClasses = [
      "bg-yellow-200/20 hover:bg-yellow-200/30",
      "bg-blue-200/20 hover:bg-blue-200/30",
      "bg-green-200/20 hover:bg-green-200/30",
      "bg-purple-200/20 hover:bg-purple-200/30",
      "bg-pink-200/20 hover:bg-pink-200/30",
    ];
    const randomClass = randomColorClasses[note.id.charCodeAt(0) % randomColorClasses.length];

    return (
        <div key={note.id} className={`${randomClass} p-4 rounded-lg text-sm font-caption flex flex-col justify-between transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
            <p className="flex-grow">{note.payload.text}</p>
            <p className="text-xs text-muted-foreground mt-2 text-right">
                {note.createdAt?.toDate ? formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true }) : 'just now'}
            </p>
        </div>
    );
  };


  return (
    <>
      <AddNoteDialog spaceId={spaceSlug} open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen} />
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          
          {/* 1. Soft Welcome Moment */}
          <section className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground animate-in fade-in duration-1000">
              Welcome back, {user.displayName || 'friend'}.
            </h1>
            <p className="text-muted-foreground font-caption mt-2 animate-in fade-in duration-1000 delay-500">
              This is your shared space. Take a breath, settle in.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">

                {/* 2. Live Duo Presence Panel & 3. Personalized Welcome Tile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="flex flex-col justify-between group">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Presence</span>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Avatar className="w-8 h-8 border-2 border-green-400">
                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${user.uid}`} />
                                            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
                                    </div>
                                    <div className="h-px w-6 bg-muted-foreground/30"></div>
                                     <div className="relative">
                                        <Avatar className="w-8 h-8 border-2 border-transparent opacity-50">
                                            <AvatarImage src="https://i.pravatar.cc/150?u=partner" />
                                            <AvatarFallback>P</AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground font-caption">You're online. Partner was last seen 2 hours ago.</p>
                        </CardContent>
                        <CardContent>
                          <Button variant="secondary" className="w-full invisible group-hover:visible transition-all">Tap to sync</Button>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col justify-center">
                        <CardContent className="flex items-center gap-4 text-center">
                            {welcomeIcon}
                            <p className="text-sm font-caption text-muted-foreground">{welcomeMessage}</p>
                        </CardContent>
                    </Card>
                </div>
              
                {/* 4. What's on your mind? */}
                <Card>
                    <CardContent className="flex items-center gap-4 pt-6">
                        <Pen className="text-primary"/>
                        <Textarea placeholder="Write one thought or feeling..." rows={1} className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                        <Button size="sm">Share</Button>
                    </CardContent>
                </Card>

                {/* 5. Memory of the Day */}
                {memoryOfTheDayImage && (
                  <Card className="overflow-hidden">
                    <div className="relative aspect-[16/9]">
                        <Image src={memoryOfTheDayImage.imageUrl} alt="Memory of the day" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                            <p className="text-primary-foreground font-caption text-sm mb-1">A small moment worth revisiting.</p>
                            <h3 className="text-primary-foreground font-headline text-2xl">You added this 3 months ago.</h3>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Button size="icon" variant="ghost" className="text-white hover:text-red-500 hover:bg-white/10"><Heart /></Button>
                        </div>
                    </div>
                  </Card>
                )}

                {/* 7. Living Notes Board */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Living Notes</span>
                      <Button variant="secondary" size="sm" onClick={() => setIsAddNoteDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Note
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {notesLoading && <div className="text-center text-muted-foreground font-caption">Loading notes...</div>}
                    {!notesLoading && notes && notes.length > 0 ? (
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         {notes.map(renderNote)}
                       </div>
                    ) : (
                       <p className="text-muted-foreground font-caption text-sm text-center py-4">No notes yet. Why not leave the first one?</p>
                    )}
                  </CardContent>
                </Card>

            </div>

            {/* Right Column */}
            <div className="space-y-6">

              {/* 6. Daily Mini-Interaction */}
              <Card>
                  <CardHeader><CardTitle>Tiny Rituals</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                              <Smile className="text-primary"/>
                              <span className="font-caption text-sm">Daily Check-in</span>
                          </div>
                          <ChevronRight/>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                              <Heart className="text-red-400"/>
                              <span className="font-caption text-sm">Send Gratitude Blink</span>
                          </div>
                          <ChevronRight/>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                              <MessageCircle className="text-blue-400"/>
                              <span className="font-caption text-sm">Quick Question</span>
                          </div>
                          <ChevronRight/>
                      </div>
                  </CardContent>
              </Card>

              {/* 8. Shared Goal Bubble */}
              <Card>
                  <CardHeader>
                    <CardTitle>This Week's Goal</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <CalendarHeart className="w-8 h-8 text-primary"/>
                    </div>
                    <div className="flex-1">
                        <p className="font-headline">Plan weekend activity</p>
                        <p className="text-sm font-caption text-muted-foreground">Tap to open Shared Plans board.</p>
                    </div>
                  </CardContent>
              </Card>

              {/* 9. Ambient Widgets */}
              <Card>
                  <CardHeader><CardTitle>Ambient Mood</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 text-center">
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2"><Droplets/><span className="mt-1 text-xs">Gentle Rain</span></Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2"><Wind/><span className="mt-1 text-xs">Breathing</span></Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2"><Flower2/><span className="mt-1 text-xs">Growing Plant</span></Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2"><Sparkles/><span className="mt-1 text-xs">Soft Gradient</span></Button>
                  </CardContent>
              </Card>
              
              {/* 11 & 12. Quick Navigation with Notification Dots */}
              <Card>
                <CardHeader>
                  <CardTitle>Explore Your Space</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Link href="#" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="font-caption text-sm">Memory Wall</span>
                        <div className="relative"><Bell className="w-4 h-4 text-transparent"/><div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary animate-pulse"></div></div>
                    </Link>
                    <Link href="#" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="font-caption text-sm">Agreements Board</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                    </Link>
                </CardContent>
              </Card>

               {/* 13. Highlights from this week */}
                <Card>
                    <CardHeader><CardTitle>This Week's Highlights</CardTitle></CardHeader>
                    <CardContent className="text-sm font-caption text-muted-foreground space-y-2">
                        <p>+ 3 new notes added</p>
                        <p>+ 5 memories viewed</p>
                        <p>+ 2 check-ins done</p>
                    </CardContent>
                </Card>
            </div>
          </div>
          
          {/* 14. Friendly Footer */}
          <footer className="mt-16 text-center">
              <p className="text-sm font-caption text-muted-foreground">Your shared space grows with every small moment.</p>
              <p className="text-sm font-caption text-muted-foreground">Take your time here.</p>
              <Button asChild variant="link" className="mt-4">
                  <Link href={`/space/${spaceSlug}/lobby`}>
                      Back to Lobby
                  </Link>
              </Button>
          </footer>
        </main>
      </div>
    </>
  );
}
