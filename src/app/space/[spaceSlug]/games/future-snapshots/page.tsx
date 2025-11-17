
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, Sparkles, Wand2, CheckCircle, Circle, Edit, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const topics = [
    "Next 3 Months",
    "Next Weekend",
    "A Habit to Build",
    "Next Big Change",
    "A Place We Want to Visit",
    "Our Next Routine",
    "Something We Want to Improve Together",
];

interface PlayerState {
    id: string;
    text: string;
    submitted: boolean;
}

interface GameState {
  topic: string;
  playerA: PlayerState;
  playerB: PlayerState;
  revealed: boolean;
  createdAt: any;
}

export default function FutureSnapshotsPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [visionText, setVisionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
    const allMembersRaw = localStorage.getItem(`allMembers-for-${spaceSlug}`);
    
    if (!memberId || !allMembersRaw) {
      router.push(`/space/${spaceSlug}/lobby`);
      return;
    }
    
    setCurrentMemberId(memberId);
    
    const allMembers = JSON.parse(allMembersRaw);
    const partner = allMembers.find((m: { id: string }) => m.id !== memberId);
    if (partner) {
      setPartnerId(partner.id);
    }
  }, [spaceSlug, router]);

  const gameDocRef = useMemoFirebase(() => {
    if (!firestore || !spaceSlug) return null;
    return doc(firestore, `spaces/${spaceSlug}/games`, 'future-snapshots');
  }, [firestore, spaceSlug]);

  useEffect(() => {
    if (!gameDocRef || !currentMemberId || !partnerId) return;
    
    const unsubscribe = onSnapshot(gameDocRef, (doc) => {
      setLoading(false);
      
      if (doc.exists()) {
        const data = doc.data() as GameState;
        if (data.playerA.id !== currentMemberId && data.playerA.id !== partnerId) {
            startNewGame();
        } else {
            setGameState(data);
        }
      } else {
        startNewGame();
      }
    });
    
    return () => unsubscribe();
  }, [gameDocRef, currentMemberId, partnerId]);

  const startNewGame = async () => {
    if (!gameDocRef || !currentMemberId || !partnerId) return;
    
    setIsSubmitting(true);
    try {
      const playerAId = currentMemberId < partnerId ? currentMemberId : partnerId;
      const playerBId = currentMemberId > partnerId ? currentMemberId : partnerId;

      await setDoc(gameDocRef, {
        topic: '',
        playerA: { id: playerAId, text: '', submitted: false },
        playerB: { id: playerBId, text: '', submitted: false },
        revealed: false,
        createdAt: new Date(),
      });
      
      setVisionText('');
    } catch (error) {
      console.error("Error starting new game:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not start a new game." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleTopicSelect = async (selectedTopic: string) => {
    if (!gameDocRef) return;
    await updateDoc(gameDocRef, { topic: selectedTopic });
  };
  
  const handleSubmitVision = async () => {
    if (!gameDocRef || !currentMemberId || isSubmitting || !visionText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const isPlayerA = currentMemberId === gameState?.playerA?.id;
      const updateField = isPlayerA ? 'playerA.submitted' : 'playerB.submitted';
      const updateTextField = isPlayerA ? 'playerA.text' : 'playerB.text';

      await updateDoc(gameDocRef, { 
        [updateTextField]: visionText,
        [updateField]: true 
      });

    } catch (error) {
      console.error("Error submitting vision:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not submit your vision." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReveal = async () => {
    if (!gameDocRef) return;
    await updateDoc(gameDocRef, { revealed: true });
  }

  if (loading || !gameState || !currentMemberId) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8" />
        </main>
      </div>
    );
  }

  const isPlayerA = currentMemberId === gameState.playerA.id;
  const myState = isPlayerA ? gameState.playerA : gameState.playerB;
  const partnerState = isPlayerA ? gameState.playerB : gameState.playerA;

  const renderContent = () => {
    // Stage 1: Topic Selection
    if (!gameState.topic) {
        if (!isPlayerA) {
            return (
                <div className="text-center p-8 bg-muted rounded-lg max-w-md mx-auto">
                    <h3 className="font-headline text-xl">Waiting for your partner...</h3>
                    <p className="font-caption text-muted-foreground mt-2">They are choosing a topic for your Future Snapshot.</p>
                    <div className="mt-4 flex justify-center"><Loader2 className="animate-spin" /></div>
                </div>
            )
        }
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Choose a Topic</CardTitle>
                    <CardDescription className="text-center">Pick a category for your future vision.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {topics.map(topic => (
                        <Button key={topic} variant="outline" className="h-16 text-base" onClick={() => handleTopicSelect(topic)}>
                            {topic}
                        </Button>
                    ))}
                </CardContent>
            </Card>
        );
    }
    
    // Stage 4: Reveal
    if (gameState.revealed) {
        return (
            <Card className="max-w-4xl mx-auto text-center">
              <CardHeader>
                <div className="flex justify-center mb-4"><PartyPopper className="w-12 h-12 text-primary"/></div>
                <CardTitle className="text-3xl">Future Snapshot: {gameState.topic}</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6 text-left">
                <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-bold mb-2">Your Vision</h4>
                    <p className="whitespace-pre-wrap">{myState.text}</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-bold mb-2">Partner's Vision</h4>
                    <p className="whitespace-pre-wrap">{partnerState.text}</p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4 items-center">
                 <p className="text-muted-foreground font-caption italic">What surprised you? Where do your visions align?</p>
                <Button onClick={startNewGame}>Play Again</Button>
              </CardFooter>
            </Card>
        )
    }

    // Stage 2 & 3: Writing & Waiting
    if (!myState.submitted) {
        return (
             <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Your Vision for: "{gameState.topic}"</CardTitle>
                    <CardDescription className="text-center">Write 2-3 sentences about what you imagine. It's a secret for now!</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        placeholder="I see us..."
                        value={visionText}
                        onChange={(e) => setVisionText(e.target.value)}
                        rows={5}
                        disabled={isSubmitting}
                    />
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={handleSubmitVision} disabled={isSubmitting || !visionText.trim()}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Vision"}
                    </Button>
                </CardFooter>
            </Card>
        )
    }
    
    if (myState.submitted && !partnerState.submitted) {
        return (
             <div className="text-center p-8 bg-muted rounded-lg max-w-md mx-auto">
                <h3 className="font-headline text-xl">Waiting for your partner...</h3>
                <p className="font-caption text-muted-foreground mt-2">They are writing their vision. The reveal is next!</p>
                <div className="mt-4 flex justify-center"><Loader2 className="animate-spin" /></div>
            </div>
        )
    }
    
    // Both submitted, ready to reveal
    return (
        <Card className="max-w-md mx-auto text-center p-8">
            <CardHeader>
                <CardTitle className="text-2xl">Both Visions Are In!</CardTitle>
                <CardDescription>Ready to see how they compare?</CardDescription>
            </CardHeader>
            <CardContent>
                <Button size="lg" onClick={handleReveal}>
                    <Wand2 className="mr-2" />
                    Reveal Now
                </Button>
            </CardContent>
        </Card>
    )

  };

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary"/>
            <div>
                <h1 className="text-4xl font-headline font-bold">Future Snapshots</h1>
                <p className="text-muted-foreground font-caption mt-1">What does the future look like for both of you?</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/space/${spaceSlug}/games`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Link>
          </Button>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
