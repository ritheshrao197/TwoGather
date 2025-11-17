
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, BookOpen, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const prompts = [
    "Start a dramatic story...",
    "Begin a mystery...",
    "Start a strange dream...",
    "Begin a totally normal day... or is it?",
    "Start a story about food gone wrong",
    "Start something chaotic",
    "Begin a story about a secret agent cat...",
    "Write the opening of a space opera...",
    "Start a fairy tale with a modern twist...",
];

interface GameState {
  prompt: string;
  partA: string;
  partB: string;
  turn: 'A' | 'B' | 'reveal';
  playerAId: string;
  playerBId: string;
  createdAt: any;
}

export default function StoryIn10WordsPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wordCount = useMemo(() => words.trim().split(/\s+/).filter(Boolean).length, [words]);
  
  // Get member IDs from localStorage
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

  // Memoize the document reference
  const gameDocRef = useMemoFirebase(() => {
    if (!firestore || !spaceSlug) return null;
    return doc(firestore, `spaces/${spaceSlug}/games`, 'story-in-10-words');
  }, [firestore, spaceSlug]);

  // Listen for game updates
  useEffect(() => {
    if (!gameDocRef || !currentMemberId || !partnerId) return;
    
    const unsubscribe = onSnapshot(gameDocRef, (doc) => {
      setLoading(false);
      
      if (doc.exists()) {
        const data = doc.data() as GameState;
        // If the game state is from a different pair of players, restart it.
        if (data.playerAId !== currentMemberId && data.playerAId !== partnerId) {
            startNewRound();
        } else {
            setGameState(data);
        }
      } else {
        startNewRound();
      }
    });
    
    return () => unsubscribe();
  }, [gameDocRef, currentMemberId, partnerId]);

  const startNewRound = async () => {
    if (!gameDocRef || !currentMemberId || !partnerId) return;
    
    setIsSubmitting(true);
    try {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      const playerA = currentMemberId < partnerId ? currentMemberId : partnerId;
      const playerB = currentMemberId > partnerId ? currentMemberId : partnerId;

      await setDoc(gameDocRef, {
        prompt: randomPrompt,
        partA: '',
        partB: '',
        turn: 'A',
        playerAId: playerA,
        playerBId: playerB,
        createdAt: new Date()
      });
      
      setWords('');
    } catch (error) {
      console.error("Error starting new round:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not start a new round."
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSubmitWords = async () => {
    if (!gameDocRef || !currentMemberId || !gameState || isSubmitting || wordCount !== 5) return;
    
    setIsSubmitting(true);
    
    try {
      const isPlayerA = currentMemberId === gameState.playerAId;
      
      if (isPlayerA && gameState.turn === 'A') {
        await updateDoc(gameDocRef, { partA: words.trim(), turn: 'B' });
      } else if (!isPlayerA && gameState.turn === 'B') {
        await updateDoc(gameDocRef, { partB: words.trim(), turn: 'reveal' });
      }
      setWords('');

    } catch (error) {
      console.error("Error submitting words:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not submit your words."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !gameState) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8" />
        </main>
      </div>
    );
  }

  const isMyTurn = (gameState.turn === 'A' && currentMemberId === gameState.playerAId) || (gameState.turn === 'B' && currentMemberId === gameState.playerBId);
  const finalStory = `${gameState.partA} ${gameState.partB}`;
  
  const renderContent = () => {
    if (gameState.turn === 'reveal') {
      return (
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
                <PartyPopper className="w-12 h-12 text-primary"/>
            </div>
            <CardTitle className="text-2xl">Your 10-Word Story!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold p-6 bg-muted rounded-lg">"{finalStory}"</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={startNewRound}>
              Play Again
            </Button>
          </CardFooter>
        </Card>
      );
    }
    
    if (isMyTurn) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                <CardTitle className="text-center text-2xl">
                    {gameState.turn === 'A' ? "Start the Story" : "Finish the Story"}
                </CardTitle>
                <CardDescription className="text-center">{gameState.prompt}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder="Type exactly 5 words..."
                        value={words}
                        onChange={(e) => setWords(e.target.value)}
                        rows={3}
                        disabled={isSubmitting}
                    />
                    <div className={`text-sm font-medium ${wordCount === 5 ? 'text-green-500' : 'text-red-500'}`}>
                        Word Count: {wordCount} / 5
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={handleSubmitWords} disabled={isSubmitting || wordCount !== 5}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Words"}
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <div className="text-center p-8 bg-muted rounded-lg max-w-md mx-auto">
            <h3 className="font-headline text-xl">Waiting for your partner...</h3>
            <p className="font-caption text-muted-foreground mt-2">They are crafting their part of the story. The final result will be revealed soon!</p>
            <div className="mt-4 flex justify-center">
                <Loader2 className="animate-spin" />
            </div>
        </div>
    );
  };


  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary"/>
            <div>
                <h1 className="text-4xl font-headline font-bold">Story in 10 Words</h1>
                <p className="text-muted-foreground font-caption mt-1">Create a story together, five words at a time.</p>
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
