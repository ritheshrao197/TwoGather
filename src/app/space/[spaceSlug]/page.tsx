
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
  Check,
  Zap,
  Gift
} from 'lucide-react';
import { AddNoteDialog } from '@/components/content/add-note-dialog';
import { DailyCheckInDialog } from '@/components/rituals/daily-check-in-dialog';
import { SendGratitudeDialog } from '@/components/rituals/send-gratitude-dialog';
import { QuickQuestionDialog } from '@/components/rituals/quick-question-dialog';
import { useNotes, NoteDocument } from '@/hooks/useNotes';
import { usePresence, SpacePresence } from '@/hooks/usePresence';
import { useTapSync } from '@/hooks/useTapSync';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, fromUnixTime } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';


export default function PersonalSpacePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [partnerMemberId, setPartnerMemberId] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome back.');
  const [welcomeIcon, setWelcomeIcon] = useState(<Sun className="w-5 h-5" />);
  const [quickNoteText, setQuickNoteText] = useState('');

  // Dialog states
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isGratitudeDialogOpen, setIsGratitudeDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);

  // Simplified flow: retrieve current member from local storage.
  useEffect(() => {
    const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
    const allMembers = JSON.parse(localStorage.getItem(`allMembers-for-${spaceSlug}`) || '[]');
    const partner = allMembers.find((m: {id: string}) => m.id !== memberId);

    if (!memberId) {
      router.push(`/space/${spaceSlug}/lobby`);
    } else {
      setCurrentMemberId(memberId);
      if (partner) {
        setPartnerMemberId(partner.id);
      }
    }
  }, [spaceSlug, router]);

  const presence = usePresence(spaceSlug, currentMemberId);
  const myPresence = currentMemberId ? presence[currentMemberId] : null;
  const partnerPresence = partnerMemberId ? presence[partnerMemberId] : null;

  const { handleTap, isSyncing, syncSuccess } = useTapSync(spaceSlug, currentMemberId, () => {
    toast({
      title: '✨ Synced!',
      description: 'You and your partner tapped at the same time.',
    });
  });

  const { data: notes, isLoading: notesLoading } = useNotes(spaceSlug);
  const memoryOfTheDayImage = PlaceHolderImages.find((p) => p.id === 'memory-wall-feature');

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
  
  const getPresenceStatus = () => {
    const bothOnline = myPresence?.online && partnerPresence?.online;
    if (bothOnline) return "You are both online.";
    if (myPresence?.online && !partnerPresence?.online) {
      const lastSeen = partnerPresence?.lastSeen;
      if (typeof lastSeen === 'number' && lastSeen > 0) {
        try {
          return `Partner was last seen ${formatDistanceToNow(fromUnixTime(lastSeen / 1000), { addSuffix: true })}`;
        } catch (e) {
            return "Partner is offline.";
        }
      }
      return "Partner is offline.";
    }
    return "You're online.";
  };

  const areBothOnline = myPresence?.online && partnerPresence?.online;

  const handleShareQuickNote = async () => {
    if (!quickNoteText.trim() || !firestore || !currentMemberId) return;

    const contentRef = collection(firestore, `spaces/${spaceSlug}/content`);
    const newNote = {
      spaceId: spaceSlug,
      authorMemberId: currentMemberId,
      type: 'note',
      payload: {
        text: quickNoteText.trim(),
      },
      visibility: 'members',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      addDocumentNonBlocking(contentRef, newNote);
      toast({
        title: 'Note Shared!',
        description: 'Your thought has been added to the Living Notes.',
      });
      setQuickNoteText('');
    } catch (error) {
      console.error('Error sharing quick note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not share your note. Please try again.',
      });
    }
  };


  if (!currentMemberId) {
    return (
      <div className="flex flex-col min-h-dvh bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 font-caption text-muted-foreground">Verifying your entry...</p>
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
      <AddNoteDialog spaceId={spaceSlug} open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen} authorId={currentMemberId}/>
      <DailyCheckInDialog spaceId={spaceSlug} open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen} authorId={currentMemberId} />
      {partnerMemberId && <SendGratitudeDialog spaceId={spaceSlug} open={isGratitudeDialogOpen} onOpenChange={setIsGratitudeDialogOpen} authorId={currentMemberId} targetId={partnerMemberId} />}
      <QuickQuestionDialog spaceId={spaceSlug} open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen} authorId={currentMemberId} />
      
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          
          <section className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground animate-in fade-in duration-1000">
              Welcome, {currentMemberId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}.
            </h1>
            <p className="text-muted-foreground font-caption mt-2 animate-in fade-in duration-1000 delay-500">
              This is your shared space. Take a breath, settle in.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="flex flex-col justify-between group">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Presence</span>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Avatar className={`w-8 h-8 border-2 ${myPresence?.online ? 'border-green-400' : 'border-transparent'}`}>
                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${currentMemberId}`} />
                                            <AvatarFallback>{currentMemberId?.[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {myPresence?.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />}
                                    </div>
                                    <div className={`h-px w-6 transition-colors ${areBothOnline ? 'bg-green-400' : 'bg-muted-foreground/30'}`}></div>
                                     <div className="relative">
                                        <Avatar className={`w-8 h-8 border-2 transition-all ${partnerPresence?.online ? 'border-green-400' : 'border-transparent opacity-50'}`}>
                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${partnerMemberId}`} />
                                            <AvatarFallback>{partnerMemberId?.[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {partnerPresence?.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />}
                                    </div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground font-caption">{getPresenceStatus()}</p>
                        </CardContent>
                        <CardContent>
                          <Button variant="secondary" className={`w-full transition-all ${!areBothOnline && 'invisible group-hover:invisible'}`} onClick={handleTap} disabled={isSyncing}>
                              {isSyncing ? <Sparkles className="mr-2 animate-ping" /> : <Zap className="mr-2" />}
                              {isSyncing ? 'Waiting...' : 'Tap to sync'}
                          </Button>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col justify-center">
                        <CardContent className="flex items-center gap-4 text-center p-6">
                            {welcomeIcon}
                            <p className="text-sm font-caption text-muted-foreground">{welcomeMessage}</p>
                        </CardContent>
                    </Card>
                </div>
              
                <Card>
                    <CardContent className="flex items-center gap-4 pt-6">
                        <Pen className="text-primary"/>
                        <Textarea 
                            placeholder="Write one thought or feeling..." 
                            rows={1} 
                            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                            value={quickNoteText}
                            onChange={(e) => setQuickNoteText(e.target.value)}
                        />
                        <Button size="sm" onClick={handleShareQuickNote} disabled={!quickNoteText.trim()}>Share</Button>
                    </CardContent>
                </Card>

                {memoryOfTheDayImage && (
                  <Card className="overflow-hidden group">
                    <div className="relative aspect-[16/9]">
                        <Image src={memoryOfTheDayImage.imageUrl} alt="Memory of the day" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Living Notes</span>
                      <Button variant="secondary" size="sm" onClick={() => setIsAddNoteDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Note
                      </Button>
                    </CardTitle>
                    <CardDescription>Lightweight messages and thoughts for each other.</CardDescription>
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

            <div className="space-y-6">

              <Card>
                  <CardHeader><CardTitle>Tiny Rituals</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setIsCheckInDialogOpen(true)}>
                          <div className="flex items-center gap-3">
                              <Smile className="text-primary"/>
                              <span className="font-caption text-sm">Daily Check-in</span>
                          </div>
                          <ChevronRight/>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setIsGratitudeDialogOpen(true)}>
                          <div className="flex items-center gap-3">
                              <Heart className="text-red-400"/>
                              <span className="font-caption text-sm">Send Gratitude Blink</span>
                          </div>
                          <ChevronRight/>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setIsQuestionDialogOpen(true)}>
                          <div className="flex items-center gap-3">
                              <MessageCircle className="text-blue-400"/>
                              <span className="font-caption text-sm">Quick Question</span>
                          </div>
                          <ChevronRight/>
                      </div>
                  </CardContent>
              </Card>

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

              <Card>
                  <CardHeader><CardTitle>Ambient Mood</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 text-center">
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2"><Droplets/><span className="mt-1 text-xs">Gentle Rain</span></Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2"><Wind/><span className="mt-1 text-xs">Breathing</span></Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2"><Flower2/><span className="mt-1 text-xs">Growing Plant</span></Button>
                    <Button variant="outline" size="sm" className="flex-col h-auto py-2"><Sparkles/><span className="mt-1 text-xs">Soft Gradient</span></Button>
                  </CardContent>
              </Card>
              
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
                     <Link href="#" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="font-caption text-sm">Vault</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                    </Link>
                </CardContent>
              </Card>

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
