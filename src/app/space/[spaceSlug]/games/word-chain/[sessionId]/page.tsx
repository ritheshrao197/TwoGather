
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { ref, onValue, runTransaction, serverTimestamp } from 'firebase/database';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, GalleryVerticalEnd, Trophy, RefreshCw, Send, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface PlayerInfo {
    id: string;
}

interface GameState {
    state: 'playing' | 'finished';
    players: { [key: string]: PlayerInfo };
    currentPlayerId: string;
    chain: { word: string; authorId: string }[];
    usedWords: { [key: string]: boolean };
    timeStartedAt: number;
    turnDuration: number;
    winner: string | 'draw' | null;
}

export default function WordChainPage() {
    const params = useParams();
    const router = useRouter();
    const { rtdb } = useFirebase();
    const { toast } = useToast();

    const spaceSlug = params.spaceSlug as string;
    const sessionId = params.sessionId as string;

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [word, setWord] = useState('');
    const [timeLeft, setTimeLeft] = useState(10);
    
    const gameRef = ref(rtdb, `realtime/wordchain/${sessionId}`);

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
        } else {
            router.push(`/space/${spaceSlug}/lobby`);
        }
    }, [spaceSlug, router]);

    useEffect(() => {
        if (!sessionId) return;
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGameState(data);
            } else {
                toast({ variant: 'destructive', title: 'Game Over', description: 'This game session has ended.'});
                router.push(`/space/${spaceSlug}/games`);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [sessionId, gameRef, router, spaceSlug, toast]);

    useEffect(() => {
        if (gameState?.state !== 'playing' || !gameState.timeStartedAt) {
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - gameState.timeStartedAt) / 1000);
            const remaining = Math.max(0, gameState.turnDuration - elapsed);
            setTimeLeft(remaining);

            if (remaining === 0 && gameState.currentPlayerId === currentMemberId) {
                runTransaction(gameRef, (session: GameState | null) => {
                    if (session && session.state === 'playing' && session.currentPlayerId === currentMemberId) {
                        session.state = 'finished';
                        session.winner = partnerId;
                    }
                    return session;
                });
            }
        }, 500);

        return () => clearInterval(interval);
    }, [gameState, currentMemberId, partnerId, gameRef]);

    const getPlayerName = useCallback((playerId: string) => {
        const allMembersRaw = localStorage.getItem(`allMembers-for-${spaceSlug}`);
        if (!allMembersRaw) return 'Player';
        const allMembers = JSON.parse(allMembersRaw);
        const member = allMembers.find((m: { id: string }) => m.id === playerId);
        return member?.displayName || 'Player';
    }, [spaceSlug]);

    const handleSubmitWord = async () => {
        const normalizedWord = word.trim().toLowerCase();
        if (!normalizedWord || !currentMemberId || !partnerId) return;

        setIsSubmitting(true);

        try {
            await runTransaction(gameRef, (session: GameState | null) => {
                if (!session) throw new Error("Session missing");
                if (session.state !== 'playing') throw new Error("Not playing");
                if (session.currentPlayerId !== currentMemberId) throw new Error("Not your turn");
                
                const now = Date.now();
                if ((now - session.timeStartedAt) / 1000 > session.turnDuration) {
                    session.state = 'finished';
                    session.winner = partnerId;
                    return session;
                }

                const lastWord = session.chain?.length ? session.chain[session.chain.length - 1].word : null;
                
                if (lastWord) {
                    if (normalizedWord[0] !== lastWord[lastWord.length - 1]) {
                        throw new Error(`Must start with "${lastWord[lastWord.length - 1]}"`);
                    }
                }
                if (session.usedWords && session.usedWords[normalizedWord]) {
                    throw new Error("Word already used");
                }
                
                session.chain = session.chain || [];
                session.chain.push({ word: normalizedWord, authorId: currentMemberId });
                session.usedWords = session.usedWords || {};
                session.usedWords[normalizedWord] = true;
                session.currentPlayerId = partnerId;
                session.timeStartedAt = now; 
                
                return session;
            });
            setWord('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Invalid Word', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleRestart = async () => {
        if (!gameState || !currentMemberId) return;
        
        await runTransaction(gameRef, (session) => {
            if (!session) return session;
            session.state = 'playing';
            session.chain = [];
            session.usedWords = {};
            session.winner = null;
            session.currentPlayerId = currentMemberId;
            session.timeStartedAt = Date.now();
            return session;
        });
    }

    const isMyTurn = gameState?.currentPlayerId === currentMemberId && gameState.state === 'playing';

    const renderStatus = () => {
        if (!gameState || !currentMemberId) return null;

        if (gameState.state === 'finished') {
            if (gameState.winner) {
                 const winnerName = getPlayerName(gameState.winner);
                 const isMe = gameState.winner === currentMemberId;
                return <Alert className={cn(isMe ? "bg-green-500/10 border-green-500/50" : "bg-red-500/10 border-red-500/50")}>
                    <Trophy className="h-4 w-4"/>
                    <AlertTitle>{isMe ? "You Won!" : `${winnerName} Won!`}</AlertTitle>
                </Alert>
            }
        }
        
        const turnPlayerName = getPlayerName(gameState.currentPlayerId);
        return (
            <p className="text-center font-caption text-lg">
                {isMyTurn ? "Your turn" : `Waiting for ${turnPlayerName}...`}
            </p>
        );
    }
    
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-dvh"><Loader2 className="animate-spin text-primary" size={48} /></div>;
    }

    if (!gameState) {
        return <div className="flex items-center justify-center min-h-dvh"><p>Game not found.</p></div>;
    }

    const lastLetter = gameState.chain?.length > 0 ? gameState.chain[gameState.chain.length - 1].word.slice(-1) : 'Any';

    return (
        <div className="flex flex-col min-h-dvh bg-background text-foreground">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center gap-3">
                            <GalleryVerticalEnd className="w-8 h-8 text-primary"/>
                            <CardTitle className="text-3xl font-headline">Word Chain</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="mb-4 w-full text-center">
                           {renderStatus()}
                        </div>
                        
                        {gameState.state === 'playing' && (
                            <div className="w-full space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Timer className="w-5 h-5"/>
                                    <Progress value={(timeLeft / gameState.turnDuration) * 100} className="h-2" />
                                    <span className="font-mono text-lg">{timeLeft}s</span>
                                </div>
                            </div>
                        )}

                        <div className="w-full h-48 bg-muted rounded-lg p-3 overflow-y-auto flex flex-col-reverse">
                           <div className="flex flex-col gap-2">
                            {[...(gameState.chain || [])].reverse().map((entry, index) => (
                                <div key={index} className={cn("p-2 rounded-lg text-sm", entry.authorId === currentMemberId ? 'bg-primary/10 text-right' : 'bg-secondary')}>
                                   <span className="font-bold">{entry.word}</span>
                                   <span className="text-xs text-muted-foreground ml-2">- {getPlayerName(entry.authorId)}</span>
                                </div>
                            ))}
                            </div>
                        </div>

                         {gameState.state === 'playing' && (
                             <div className="w-full space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Next word starts with: <span className="font-bold text-primary uppercase">{lastLetter}</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        placeholder={isMyTurn ? "Your word..." : "Waiting..."}
                                        value={word}
                                        onChange={(e) => setWord(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSubmitWord();
                                        }}
                                        disabled={!isMyTurn || isSubmitting}
                                    />
                                    <Button onClick={handleSubmitWord} disabled={!isMyTurn || isSubmitting || !word.trim()}>
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                                    </Button>
                                </div>
                             </div>
                         )}

                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        {gameState.state === 'finished' && (
                             <Button onClick={handleRestart} className="w-full">
                                <RefreshCw className="mr-2" /> Play Again
                            </Button>
                        )}
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/space/${spaceSlug}/games`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Games Hub
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
