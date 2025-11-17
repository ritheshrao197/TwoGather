
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Smile,
  Pen,
  ChevronRight,
  Plus,
  Palette,
  Settings,
  BookUser,
  LayoutGrid,
  Lock,
  MessageSquare,
  User,
  ClipboardList,
  CalendarCheck2,
  Paperclip
} from 'lucide-react';
import { DailyCheckInDialog } from '@/components/rituals/daily-check-in-dialog';
import { SendGratitudeDialog } from '@/components/rituals/send-gratitude-dialog';
import { QuickQuestionDialog } from '@/components/rituals/quick-question-dialog';
import { InteractionFeed } from '@/components/rituals/interaction-feed';
import { usePresence } from '@/hooks/usePresence';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, fromUnixTime } from 'date-fns';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useChatStore } from '@/hooks/useChatStore';
import { AddMemoryDialog } from '@/components/content/add-memory-dialog';
import { AddNoteDialog } from '@/components/content/add-note-dialog';


interface MemberProfile {
  avatarUrl?: string;
  bio?: string;
  mood?: string;
  pronouns?: string;
}

interface MemberData {
  id: string;
  displayName: string;
  profile?: MemberProfile;
}

export default function PersonalSpacePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();
  const { toggleChat } = useChatStore();

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [partnerMemberId, setPartnerMemberId] = useState<string | null>(null);
  
  // Dialog states
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isGratitudeDialogOpen, setIsGratitudeDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isAddMemoryDialogOpen, setIsAddMemoryDialogOpen] = useState(false);
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);

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

  const memoizedMembersRef = useMemoFirebase(
    () => (firestore && spaceSlug ? collection(firestore, 'spaces', spaceSlug, 'members') : null),
    [firestore, spaceSlug]
  );
  const { data: membersData } = useCollection<MemberData>(memoizedMembersRef);

  const currentMember = membersData?.find(m => m.id === currentMemberId);
  const partnerMember = membersData?.find(m => m.id === partnerMemberId);

  const presence = usePresence(spaceSlug, currentMemberId);
  const myPresence = currentMemberId ? presence[currentMemberId] : null;
  const partnerPresence = partnerMemberId ? presence[partnerMemberId] : null;

  const memoryOfTheDayImage = PlaceHolderImages.find((p) => p.id === 'memory-wall-feature');

  const getPresenceStatus = (memberId: string | null) => {
    if (!memberId) return "Offline";
    const memberPresence = presence[memberId];

    if (memberPresence?.online) return "Online now";
    if (memberPresence?.lastSeen) {
      try {
        return `Last seen ${formatDistanceToNow(fromUnixTime(memberPresence.lastSeen / 1000), { addSuffix: true })}`;
      } catch (e) {
          return "Offline";
      }
    }
    return "Offline";
  };
  
  if (!currentMemberId || !membersData) {
    return (
      <div className="flex flex-col min-h-dvh bg-background">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="mt-4 font-caption text-muted-foreground">Loading your space...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <DailyCheckInDialog spaceId={spaceSlug} open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen} authorId={currentMemberId} />
      {partnerMemberId && <SendGratitudeDialog spaceId={spaceSlug} open={isGratitudeDialogOpen} onOpenChange={setIsGratitudeDialogOpen} authorId={currentMemberId} targetId={partnerMemberId} />}
      <QuickQuestionDialog spaceId={spaceSlug} open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen} authorId={currentMemberId} />
      <AddMemoryDialog spaceId={spaceSlug} authorId={currentMemberId} open={isAddMemoryDialogOpen} onOpenChange={setIsAddMemoryDialogOpen} />
      <AddNoteDialog spaceId={spaceSlug} authorId={currentMemberId} open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen} />

      <div className="flex flex-col min-h-dvh bg-background text-foreground transition-colors duration-1000">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          
          <section className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
              Welcome, {currentMember?.displayName}.
            </h1>
            <p className="text-muted-foreground font-caption mt-2">
              This is your shared space. Take a breath, settle in.
            </p>
          </section>

          <section className="mb-8">
            <div className="flex justify-center items-center gap-4">
                <Link href={`/space/${spaceSlug}/profile`} className="flex flex-col items-center gap-2 text-center group">
                   <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-primary/50 group-hover:border-primary transition-colors">
                            <AvatarImage src={currentMember?.profile?.avatarUrl} />
                            <AvatarFallback>{currentMember?.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        {myPresence?.online && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-background" />}
                   </div>
                   <span className="text-sm font-medium">{currentMember?.displayName}</span>
                   <span className="text-xs text-muted-foreground">{getPresenceStatus(currentMemberId)}</span>
                </Link>
                <div className="h-px w-12 bg-border"></div>
                 <Link href="#" className="flex flex-col items-center gap-2 text-center group cursor-not-allowed opacity-70">
                   <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-border group-hover:border-primary transition-colors">
                            <AvatarImage src={partnerMember?.profile?.avatarUrl} />
                            <AvatarFallback>{partnerMember?.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        {partnerPresence?.online && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-background" />}
                   </div>
                   <span className="text-sm font-medium">{partnerMember?.displayName}</span>
                   <span className="text-xs text-muted-foreground">{getPresenceStatus(partnerMemberId)}</span>
                </Link>
            </div>
          </section>

          <section className="mb-8">
             <Card>
                <CardContent className="p-4 flex justify-around items-center">
                    <Button variant="ghost" className="flex flex-col h-auto gap-2" onClick={() => setIsCheckInDialogOpen(true)}>
                        <Smile className="w-6 h-6 text-primary"/>
                        <span className="text-xs font-caption">Daily Check-in</span>
                    </Button>
                     <Button variant="ghost" className="flex flex-col h-auto gap-2" onClick={() => setIsGratitudeDialogOpen(true)}>
                        <Heart className="w-6 h-6 text-red-500"/>
                        <span className="text-xs font-caption">Gratitude Blink</span>
                    </Button>
                     <Button variant="ghost" className="flex flex-col h-auto gap-2" onClick={() => setIsQuestionDialogOpen(true)}>
                        <MessageCircle className="w-6 h-6 text-blue-500"/>
                        <span className="text-xs font-caption">Quick Question</span>
                    </Button>
                </CardContent>
            </Card>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <InteractionFeed spaceId={spaceSlug} currentMemberId={currentMemberId} />
                
                {memoryOfTheDayImage && (
                  <Card className="overflow-hidden group">
                    <CardHeader>
                        <CardTitle>Memory of the Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative aspect-[16/9]">
                            <Image src={memoryOfTheDayImage.imageUrl} alt="Memory of the day" fill className="object-cover transition-transform duration-500 group-hover:scale-105" data-ai-hint={memoryOfTheDayImage.imageHint} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6">
                                <h3 className="text-primary-foreground font-headline text-2xl">You added this 3 months ago.</h3>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                )}
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => setIsAddMemoryDialogOpen(true)}><Paperclip/><span>Add Memory</span></Button>
                        <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => setIsAddNoteDialogOpen(true)}><Pen/><span>Write Note</span></Button>
                        <Button variant="outline" className="h-20 flex-col gap-1" disabled><ClipboardList/><span>Shared Task</span></Button>
                        <Button variant="outline" className="h-20 flex-col gap-1" onClick={toggleChat}><MessageSquare/><span>Open Chat</span></Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Explore Your Space</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href={`/space/${spaceSlug}/memory-wall`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <span className="font-caption text-sm flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-muted-foreground"/>Memory Wall</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                        </Link>
                        <Link href={`/space/${spaceSlug}/agreements`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <span className="font-caption text-sm flex items-center gap-2"><BookUser className="w-4 h-4 text-muted-foreground"/>Agreements</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                        </Link>
                         <Link href={`/space/${spaceSlug}/vault`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <span className="font-caption text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-muted-foreground"/>Vault</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                        </Link>
                         <Link href="#" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors opacity-50 cursor-not-allowed">
                            <span className="font-caption text-sm flex items-center gap-2"><CalendarCheck2 className="w-4 h-4 text-muted-foreground"/>Shared Planner</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Profile & Customization</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                         <Link href={`/space/${spaceSlug}/profile`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <span className="font-caption text-sm flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/>Your Profile</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                        </Link>
                        <Link href="#" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors opacity-50 cursor-not-allowed">
                            <span className="font-caption text-sm flex items-center gap-2"><Palette className="w-4 h-4 text-muted-foreground"/>Theme & Layout</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                        </Link>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                         <Link href="#" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors opacity-50 cursor-not-allowed">
                            <span className="font-caption text-sm flex items-center gap-2"><Settings className="w-4 h-4 text-muted-foreground"/>Space Settings</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                        </Link>
                    </CardContent>
                </Card>
            </div>
          </div>
          
          <footer className="mt-16 text-center">
              <p className="text-sm font-caption text-muted-foreground">Your shared space grows with every small moment.</p>
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
