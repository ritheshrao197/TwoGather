
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Gamepad2, Users, Rows3, CheckSquare, Loader2, BookOpen, Sparkles, MessagesSquare, PencilRuler, BrainCircuit, Wand2, Puzzle } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { ref, push, set } from 'firebase/database';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';


const games = [
  {
    id: 'tic-tac-toe',
    icon: Rows3,
    title: 'Love Tic-Tac-Toe',
    description: 'Play the classic game with cute love-themed icons.',
    players: '2',
    time: '1-3 min'
  },
  {
    id: 'would-you-rather',
    icon: CheckSquare,
    title: 'Would You Rather?',
    description: 'Funny dilemma cards that reveal your compatibility.',
    players: '2',
    time: '3-10 min'
  },
  {
    id: 'story-in-10-words',
    icon: BookOpen,
    title: 'Story in 10 Words',
    description: 'Create a 10-word story together, 5 words each.',
    players: '2',
    time: '2-5 min'
  },
  {
    id: 'quick-quiz',
    icon: BrainCircuit,
    title: 'Quick Quiz',
    description: 'Short multiple-choice quizzes on fun topics.',
    players: '2',
    time: '3-5 min'
  },
  {
    id: 'word-scramble',
    icon: Wand2,
    title: 'Word Scramble',
    description: 'Unscramble the same word list; fastest wins.',
    players: '2',
    time: '2-6 min'
  },
  {
    id: 'memory-match',
    icon: Puzzle,
    title: 'Memory Match',
    description: 'Classic flip tiles, take turns revealing pairs.',
    players: '2',
    time: '3-7 min'
  },
  {
    id: 'draw-guess',
    icon: PencilRuler,
    title: 'Draw & Guess',
    description: 'One partner draws a word, the other guesses.',
    players: '2',
    time: '3-6 min'
  },
];

export default function GamesHubPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { rtdb } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePlayNow = async (gameId: string) => {
   if (gameId === 'tic-tac-toe') {
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

        const sessionsRef = ref(rtdb, `realtime/sessions`);
        const newSessionRef = push(sessionsRef);
        
        const player1Id = memberId;
        const player2Id = partner.id;

        // Assign love-themed icons to players
        const loveIcons = ['❤️', '💫', '🌙', '🔥', '🍀', '🌸', '⭐'];
        const shuffledIcons = [...loveIcons].sort(() => Math.random() - 0.5);
        const playerAIcon = shuffledIcons[0];
        const playerBIcon = shuffledIcons[1];

        await set(newSessionRef, {
            type: 'tic-tac-toe',
            spaceId: spaceSlug,
            players: {
                [player1Id]: { symbol: playerAIcon },
                [player2Id]: { symbol: playerBIcon }
            },
            board: Array(9).fill(null),
            currentPlayer: player1Id,
            status: 'playing',
            winner: null,
            createdAt: Date.now(),
            expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour expiry
        });

        const sessionId = newSessionRef.key;
        router.push(`/space/${spaceSlug}/games/tic-tac-toe/${sessionId}`);
    } catch (error) {
        console.error("Failed to start game session:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start a new game session.' });
        setIsLoading(null);
    }
   } else if (gameId === 'would-you-rather') {
    // Navigate to the Would You Rather game
    router.push(`/space/${spaceSlug}/games/would-you-rather`);
   } else if (gameId === 'story-in-10-words') {
    // Navigate to the Story in 10 Words game
    router.push(`/space/${spaceSlug}/games/story-in-10-words`);
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
