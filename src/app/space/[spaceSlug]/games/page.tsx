
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Gamepad2, BrainCircuit, Puzzle, PencilRuler, Users, Wand2, Rows3, CheckSquare, Brain } from 'lucide-react';

const games = [
  {
    icon: BrainCircuit,
    title: 'Quick Quiz',
    description: 'Short multiple-choice quizzes on fun topics.',
    players: '2',
    time: '3-5 min'
  },
  {
    icon: Wand2,
    title: 'Word Scramble',
    description: 'Unscramble the same word list; fastest wins.',
    players: '2',
    time: '2-6 min'
  },
  {
    icon: Puzzle,
    title: 'Memory Match',
    description: 'Classic flip tiles, take turns revealing pairs.',
    players: '2',
    time: '3-7 min'
  },
  {
    icon: Rows3,
    title: 'Tic-Tac-Toe',
    description: 'Quick rounds of the classic game, with a timer.',
    players: '2',
    time: '1-3 min'
  },
  {
    icon: PencilRuler,
    title: 'Draw & Guess',
    description: 'One partner draws a word, the other guesses.',
    players: '2',
    time: '3-6 min'
  },
  {
    icon: CheckSquare,
    title: 'Would You Rather',
    description: 'Compare answers to fun dilemma cards.',
    players: '2',
    time: '3-10 min'
  },
];

export default function GamesHubPage() {
  const params = useParams();
  const spaceSlug = params.spaceSlug as string;

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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <game.icon className="w-6 h-6 text-primary" />
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
                <Button className="w-full" disabled>Play Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href={`/space/${spaceSlug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Your Space
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
