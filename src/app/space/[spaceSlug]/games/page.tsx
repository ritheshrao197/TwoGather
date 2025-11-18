
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Gamepad2, Users, Rows3, CheckSquare, Loader2, BookOpen, Sparkles, MessagesSquare, GalleryVerticalEnd } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { ref, push, set } from 'firebase/database';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';


const games = [
  {
    id: 'tic-tac-toe',
    icon: Rows3,
    title: 'Tic-Tac-Toe',
    description: 'Quick rounds of the classic game, with a timer.',
    players: '2',
    time: '1-3 min'
  },
  {
    id: 'dilemmas',
    icon: CheckSquare,
    title: 'Dilemmas',
    description: 'Funny choice cards that reveal how well you sync up.',
    players: '2',
    time: '3-10 min'
  },
  {
    id: 'story-in-10-words',
    icon: BookOpen,
    title: 'Story in 10 Words',
    description: 'A co-op story game where you each write 5 words.',
    players: '2',
    time: '2-5 min'
  },
  {
    id: 'future-snapshots',
    icon: Sparkles,
    title: 'Future Snapshots',
    description: 'Privately write your vision for a future moment, then reveal.',
    players: '2',
    time: '3-5 min'
  },
  {
    id: 'silent-signals',
    icon: MessagesSquare,
    title: 'Silent Signals',
    description: 'Communicate using only emojis. Can you guess the meaning?',
    players: '2',
    time: '2-4 min'
  },
  {
    id: 'word-chain',
    icon: GalleryVerticalEnd,
    title: 'Word Chain',
    description: 'Build a chain of words, one letter at a time. Don\'t break it!',
    players: '2',
    time: '3-5 min'
  }
];

export default function GamesHubPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { rtdb } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePlayNow = async (gameId: string) => {
   if (gameId === 'tic-tac-toe' || gameId === 'word-chain') {
    setIsLoading(gameId);

    try {
        const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
        const allMembersRaw = localStorage.getItem(`allMembers-for-${spaceSlug}`);
        if (!memberId || !allMembersRaw) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not identify players. Please re-enter the space.' });
            setIsLoading(null);
            return;
        }

        const allMembers = JSON.parse(allMembersRaw);
        const partner = allMembers.find((m: { id: string }) => m.id !== memberId);
        
        if (!partner) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find your partner.' });
            setIsLoading(null);
            return;
        }
        
        const sessionsRefPath = gameId === 'tic-tac-toe' ? `realtime/sessions` : `realtime/wordchain`;
        const sessionsRef = ref(rtdb, sessionsRefPath);
        const newSessionRef = push(sessionsRef);
        
        const player1Id = memberId;
        const player2Id = partner.id;

        const initialGameState = gameId === 'tic-tac-toe' ? {
            type: 'tic-tac-toe',
            board: Array(9).fill(null),
            currentPlayer: player1Id,
            status: 'playing',
            winner: null,
            players: {
                [player1Id]: { symbol: 'X' },
                [player2Id]: { symbol: 'O' }
            },
        } : {
            type: 'word-chain',
            state: 'playing',
            currentPlayerId: player1Id,
            chain: [],
            usedWords: {},
            timeStartedAt: Date.now(),
            turnDuration: 10,
            winner: null,
             players: {
                [player1Id]: { id: player1Id },
                [player2Id]: { id: player2Id }
            },
        };

        await set(newSessionRef, {
            ...initialGameState,
            spaceId: spaceSlug,
            createdAt: Date.now(),
            expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour expiry
        });

        const sessionId = newSessionRef.key;
        router.push(`/space/${spaceSlug}/games/${gameId}/${sessionId}`);
    } catch (error) {
        console.error("Failed to start game session:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start a new game session.' });
        setIsLoading(null);
    }
   } else if (gameId === 'dilemmas') {
    router.push(`/space/${spaceSlug}/games/would-you-rather`);
   } else if (gameId === 'story-in-10-words') {
    router.push(`/space/${spaceSlug}/games/story-in-10-words`);
   } else if (gameId === 'future-snapshots') {
    router.push(`/space/${spaceSlug}/games/future-snapshots`);
   } else if (gameId === 'silent-signals') {
    router.push(`/space/${spaceSlug}/games/silent-signals`);
   } else {
      toast({ variant: 'destructive', title: 'Coming Soon!', description: 'This game is not yet available.' });
      return;
   }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
              <Gamepad2 className="w-10 h-10 text-primary" />
              <div>
                <h1 className="text-4xl font-headline font-bold">Mini-Games Hub</h1>
                <p className="text-muted-foreground font-caption mt-1">A collection of fun, two-player games.</p>
              </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/space/${spaceSlug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Space
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const IconComponent = game.icon;
            return (
              <Card key={game.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                      <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                      <CardTitle className="font-headline">{game.title}</CardTitle>
                      <CardDescription className="font-caption pt-1">{game.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-caption">
                      <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {game.players} players</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePlayNow(game.id)}
                    disabled={isLoading === game.id}
                  >
                    {isLoading === game.id ? <Loader2 className="animate-spin" /> : 'Play Now'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
