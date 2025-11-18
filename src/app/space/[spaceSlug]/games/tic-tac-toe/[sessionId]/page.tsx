'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Trophy, Handshake, RefreshCw, Heart, Sparkles, Moon, Flame, Leaf, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Love-themed icons
const LoveIcons = {
  '❤️': Heart,
  '💫': Sparkles,
  '🌙': Moon,
  '🔥': Flame,
  '🍀': Leaf,
  '⭐': Star
};

interface PlayerInfo {
    symbol: '❤️' | '💫' | '🌙' | '🔥' | '🍀' | '🌸' | '⭐';
}

interface GameState {
    board: (string | null)[];
    currentPlayer: string;
    players: { [key: string]: PlayerInfo };
    status: 'playing' | 'ended';
    winner: string | 'draw' | null;
}

export default function TicTacToePage() {
    const params = useParams();
    const router = useRouter();
    const { rtdb } = useFirebase();
    const { toast } = useToast();

    const spaceSlug = params.spaceSlug as string;
    const sessionId = params.sessionId as string;

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const gameRef = ref(rtdb, `realtime/sessions/${sessionId}`);

    useEffect(() => {
        const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
        if (!memberId) {
            router.push(`/space/${spaceSlug}/lobby`);
            return;
        }
        setCurrentMemberId(memberId);

        const unsubscribe = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGameState(data);
            } else {
                toast({ variant: 'destructive', title: 'Game Over', description: 'This game session has ended or does not exist.'});
                router.push(`/space/${spaceSlug}/games`);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [spaceSlug, sessionId, router, gameRef, toast]);

    const calculateWinner = (board: (string | null)[]): string | null => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6],           // diagonals
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a]; // Returns the symbol
            }
        }
        return null;
    };
    
    const handleMove = async (index: number) => {
        if (!gameState || !currentMemberId || gameState.status === 'ended' || gameState.currentPlayer !== currentMemberId || gameState.board[index]) {
            // Show a toast message to inform the user why the move is not allowed
            if (gameState?.currentPlayer !== currentMemberId) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Not Your Turn', 
                    description: 'Please wait for your partner to make their move.' 
                });
            } else if (gameState?.board[index]) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Invalid Move', 
                    description: 'This cell is already occupied.' 
                });
            }
            return;
        }
        
        try {
            const snapshot = await get(gameRef);
            const currentRemoteState = snapshot.val();
            
            // Prevent race conditions
            if (!currentRemoteState || currentRemoteState.status === 'ended') {
                toast({ 
                    variant: 'destructive', 
                    title: 'Game Ended', 
                    description: 'This game has already ended.' 
                });
                return;
            }
            
            if (currentRemoteState.currentPlayer !== currentMemberId) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Not Your Turn', 
                    description: 'Please wait for your partner to make their move.' 
                });
                return;
            }
            
            if (currentRemoteState.board[index]) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Invalid Move', 
                    description: 'This cell is already occupied.' 
                });
                return;
            }

            const newBoard = [...currentRemoteState.board];
            newBoard[index] = currentRemoteState.players[currentMemberId].symbol;

            const winnerSymbol = calculateWinner(newBoard);
            let newStatus = 'playing';
            let newWinner = null;
            let nextPlayer = Object.keys(currentRemoteState.players).find(id => id !== currentMemberId) || currentMemberId;

            if (winnerSymbol) {
                newStatus = 'ended';
                newWinner = Object.keys(currentRemoteState.players).find(id => currentRemoteState.players[id].symbol === winnerSymbol) || null;
            } else if (!newBoard.includes(null)) {
                newStatus = 'ended';
                newWinner = 'draw';
            }

            const newState = {
                ...currentRemoteState,
                board: newBoard,
                currentPlayer: nextPlayer,
                status: newStatus,
                winner: newWinner,
            };

            await set(gameRef, newState);
        } catch (error) {
            console.error("Error making move:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Move Failed', 
                description: 'Could not complete your move. Please try again.' 
            });
        }
    };

    const handleRestart = async () => {
        if (!gameState) return;
        
        const playerIds = Object.keys(gameState.players);
        const firstPlayer = playerIds[0];

        const newState = {
            ...gameState,
            board: Array(9).fill(null),
            currentPlayer: firstPlayer,
            status: 'playing',
            winner: null,
        }
        await set(gameRef, newState);
    }
    
    const getPlayerName = (playerId: string) => {
        const allMembersRaw = localStorage.getItem(`allMembers-for-${spaceSlug}`);
        if (!allMembersRaw) return 'Player';
        const allMembers = JSON.parse(allMembersRaw);
        const member = allMembers.find((m: {id: string}) => m.id === playerId);
        return member?.displayName || 'Player';
    }

    const mySymbol = currentMemberId && gameState ? gameState.players[currentMemberId]?.symbol : null;
    const isMyTurn = gameState?.currentPlayer === currentMemberId && gameState.status === 'playing';

    const renderSquare = (index: number) => {
        const value = gameState?.board[index];
        const isClickable = !value && isMyTurn;
        
        // Get the appropriate icon component
        const IconComponent = value ? LoveIcons[value as keyof typeof LoveIcons] : null;

        return (
            <button
                key={index}
                onClick={() => handleMove(index)}
                disabled={!isClickable}
                className={cn(
                    "w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center bg-muted/50 rounded-lg transition-colors border-2 border-muted",
                    isClickable && "cursor-pointer hover:bg-muted hover:border-primary/50",
                    value && "border-primary/30"
                )}
            >
                {value && IconComponent && (
                    <IconComponent className="w-16 h-16 text-primary animate-in zoom-in duration-300" />
                )}
            </button>
        );
    };
    
    const renderStatus = () => {
        if (!gameState) return null;

        if (gameState.status === 'ended') {
            if (gameState.winner === 'draw') {
                return <Alert className="bg-purple-500/10 border-purple-500/50 text-purple-700 dark:text-purple-400">
                    <Handshake className="h-4 w-4" />
                    <AlertTitle>Perfect Harmony! It's a Draw!</AlertTitle>
                    <AlertDescription>Both players showed great skill. Harmony +1 ❤️</AlertDescription>
                </Alert>
            }
            if (gameState.winner) {
                const winnerName = getPlayerName(gameState.winner);
                const isMe = gameState.winner === currentMemberId;
                const winnerSymbol = gameState.players[gameState.winner].symbol;
                const WinnerIcon = LoveIcons[winnerSymbol as keyof typeof LoveIcons];
                
                return <Alert className="bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400">
                    <Trophy className="h-4 w-4"/>
                    <AlertTitle className="flex items-center gap-2">
                        {isMe ? "You Won!" : `${winnerName} Won!`}
                        {WinnerIcon && <WinnerIcon className="w-5 h-5 text-primary" />}
                    </AlertTitle>
                    <AlertDescription>Congratulations! Winner gets a virtual hug! 🤗</AlertDescription>
                </Alert>
            }
        }
        
        const turnPlayerName = getPlayerName(gameState.currentPlayer);
        const turnSymbol = gameState.players[gameState.currentPlayer].symbol;
        const TurnIcon = LoveIcons[turnSymbol as keyof typeof LoveIcons];
        
        return (
            <p className="text-center font-caption text-lg flex items-center justify-center gap-2">
                {isMyTurn ? (
                    <>
                        <span>Your move</span>
                        {TurnIcon && <TurnIcon className="w-5 h-5 text-primary" />}
                    </>
                ) : (
                    <>
                        <span>Waiting for {turnPlayerName}...</span>
                        {TurnIcon && <TurnIcon className="w-5 h-5 text-primary" />}
                    </>
                )}
            </p>
        );
    }

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-dvh"><Loader2 className="animate-spin text-primary" size={48} /></div>;
    }

    if (!gameState) {
        return <div className="flex items-center justify-center min-h-dvh"><p>Game not found.</p></div>;
    }
    
    return (
        <div className="flex flex-col min-h-dvh bg-background text-foreground">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-center text-3xl font-headline flex items-center justify-center gap-2">
                            <Heart className="w-6 h-6 text-pink-500" />
                            Love Tic-Tac-Toe
                            <Heart className="w-6 h-6 text-pink-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="mb-4 w-full">
                           {renderStatus()}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {Array(9).fill(null).map((_, i) => renderSquare(i))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        {gameState.status === 'ended' && (
                             <Button onClick={handleRestart} className="w-full bg-pink-500 hover:bg-pink-600">
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