
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, MessagesSquare, PartyPopper, Wand2, Send } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface GameState {
  signal: string;
  meaning: string;
  guess: string;
  turn: 'A_signal' | 'B_guess' | 'reveal';
  playerAId: string;
  playerBId: string;
  createdAt: any;
}

export default function SilentSignalsPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [emojiSignal, setEmojiSignal] = useState('');
  const [secretMeaning, setSecretMeaning] = useState('');
  const [guessText, setGuessText] = useState('');
  
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
    return doc(firestore, `spaces/${spaceSlug}/games`, 'silent-signals');
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
      const playerA = currentMemberId < partnerId ? currentMemberId : partnerId;
      const playerB = currentMemberId > partnerId ? currentMemberId : partnerId;

      await setDoc(gameDocRef, {
        signal: '',
        meaning: '',
        guess: '',
        turn: 'A_signal',
        playerAId: playerA,
        playerBId: playerB,
        createdAt: new Date()
      });
      
      setEmojiSignal('');
      setSecretMeaning('');
      setGuessText('');
    } catch (error) {
      console.error("Error starting new round:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not start a new round." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSendSignal = async () => {
    if (!gameDocRef || isSubmitting || !emojiSignal.trim() || !secretMeaning.trim()) {
        toast({ variant: "destructive", title: "Missing Info", description: "Please provide both emojis and their meaning." });
        return;
    }
    
    setIsSubmitting(true);
    try {
        await updateDoc(gameDocRef, {
            signal: emojiSignal,
            meaning: secretMeaning,
            turn: 'B_guess'
        });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not send signal." });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleSendGuess = async () => {
    if (!gameDocRef || isSubmitting || !guessText.trim()) {
        toast({ variant: "destructive", title: "Missing Guess", description: "Please enter your guess." });
        return;
    }
    
    setIsSubmitting(true);
    try {
        await updateDoc(gameDocRef, {
            guess: guessText,
            turn: 'reveal'
        });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not send guess." });
    } finally {
        setIsSubmitting(false);
    }
  }


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

  const isPlayerA = currentMemberId === gameState.playerAId;
  
  const renderContent = () => {
    // Stage 4: Reveal
    if (gameState.turn === 'reveal') {
      return (
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <div className="flex justify-center mb-4"><PartyPopper className="w-12 h-12 text-primary"/></div>
            <CardTitle className="text-3xl">The Reveal!</CardTitle>
            <CardDescription>What was the message?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-4xl p-4 bg-muted rounded-lg">{gameState.signal}</div>
            <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="p-4 border rounded-lg">
                    <h4 className="font-bold mb-2">The Sender's Meaning:</h4>
                    <p className="italic">"{gameState.meaning}"</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <h4 className="font-bold mb-2">The Guesser's Interpretation:</h4>
                    <p className="italic">"{gameState.guess}"</p>
                </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4 items-center">
            <Button onClick={startNewRound}>Play Again</Button>
          </CardFooter>
        </Card>
      );
    }

    // Stage 1: Player A sends a signal
    if (gameState.turn === 'A_signal') {
        if (isPlayerA) {
            return (
                <Card className="max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle>Create a Silent Signal</CardTitle>
                        <CardDescription>Send a message using only emojis. Your partner will try to guess what it means.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Emoji Signal</label>
                            <Input 
                                placeholder="e.g., 🧠😵➡️🍫" 
                                value={emojiSignal}
                                onChange={(e) => setEmojiSignal(e.target.value)}
                                disabled={isSubmitting}
                                className="text-2xl p-2 h-auto"
                            />
                        </div>
                         <div>
                            <label className="text-sm font-medium">The Secret Meaning</label>
                            <Textarea 
                                placeholder="What does your signal mean?"
                                value={secretMeaning}
                                onChange={(e) => setSecretMeaning(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSendSignal} disabled={isSubmitting}>
                            <Send className="mr-2" /> Send Signal
                        </Button>
                    </CardFooter>
                </Card>
            )
        }
        return (
            <div className="text-center p-8 bg-muted rounded-lg max-w-md mx-auto">
                <h3 className="font-headline text-xl">Waiting for your partner...</h3>
                <p className="font-caption text-muted-foreground mt-2">They are creating a secret emoji message for you.</p>
                <div className="mt-4 flex justify-center"><Loader2 className="animate-spin" /></div>
            </div>
        )
    }

    // Stage 2: Player B guesses
    if (gameState.turn === 'B_guess') {
        if (!isPlayerA) { // Player B's turn
             return (
                <Card className="max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle>Guess the Meaning</CardTitle>
                        <CardDescription>Your partner sent you a signal. What do you think it means?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl p-4 bg-muted rounded-lg text-center">{gameState.signal}</div>
                        <div>
                           <label className="text-sm font-medium">Your Guess</label>
                           <Textarea 
                                placeholder="What are they trying to say?"
                                value={guessText}
                                onChange={(e) => setGuessText(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSendGuess} disabled={isSubmitting}>
                            <Send className="mr-2" /> Send Guess
                        </Button>
                    </CardFooter>
                </Card>
            )
        }
        // Player A is waiting
        return (
            <div className="text-center p-8 bg-muted rounded-lg max-w-md mx-auto">
                <h3 className="font-headline text-xl">Waiting for your partner...</h3>
                <p className="font-caption text-muted-foreground mt-2">They are trying to decode your signal!</p>
                <div className="mt-4 flex justify-center"><Loader2 className="animate-spin" /></div>
            </div>
        )
    }

    return null;
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <MessagesSquare className="w-8 h-8 text-primary"/>
            <div>
                <h1 className="text-4xl font-headline font-bold">Silent Signals</h1>
                <p className="text-muted-foreground font-caption mt-1">Say it with emojis. What does it mean?</p>
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
