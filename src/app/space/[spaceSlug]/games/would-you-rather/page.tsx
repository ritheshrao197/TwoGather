'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

// Funny reaction lines
const reactionLines = [
  "One of you is chaos. The other… is also chaos.",
  "You two should not make life decisions without supervision.",
  "Perfect match… in confusion.",
  "Your compatibility is impressively unpredictable.",
  "You're both beautifully weird in your own ways.",
  "Either you're soulmates or you need separate therapy.",
  "Your choices are as synced as your Netflix passwords.",
  "In a world of chaos, you're the epicenter.",
  "Your relationship energy is pure chaos magic.",
  "You two are like two peas in a very strange pod."
];

// Funny challenges
const challenges = [
  "Act out your chosen option for 5 seconds.",
  "Explain your reasoning in only one dramatic sentence.",
  "Winner decides tomorrow's breakfast.",
  "Switch roles and do something your partner usually does.",
  "Give your partner a compliment and a silly dance move.",
  "Do a trust fall or let them draw on your hand.",
  "Take a selfie with the silliest face you can make.",
  "Whisper something only the two of you would understand.",
  "Recreate your first meeting in 10 seconds.",
  "Let your partner choose your next outfit."
];

// The 50 prompts
const prompts = [
  // Mild + Silly
  { statement: "Would you rather…", optionA: "Only eat noodles for a month", optionB: "Only eat bread for a month" },
  { statement: "Would you rather…", optionA: "Speak like a robot for a day", optionB: "Walk like a penguin for a day" },
  { statement: "Would you rather…", optionA: "Have hiccups all morning", optionB: "Sneeze exactly once every minute" },
  { statement: "Would you rather…", optionA: "Only whisper", optionB: "Only shout" },
  { statement: "Would you rather…", optionA: "Wear socks on your hands", optionB: "Shoes on your knees" },
  { statement: "Would you rather…", optionA: "Laugh uncontrollably for 2 minutes", optionB: "Cry dramatically for 10 seconds" },
  { statement: "Would you rather…", optionA: "Forget how to spell your name", optionB: "Forget your phone password" },
  { statement: "Would you rather…", optionA: "Be chased by 20 ducks", optionB: "Avoid one very suspicious-looking squirrel" },
  { statement: "Would you rather…", optionA: "Have spaghetti hair", optionB: "Marshmallow hands" },
  { statement: "Would you rather…", optionA: "Sleep upside-down like a bat", optionB: "Walk backwards all day" },
  
  // Food Chaos
  { statement: "Would you rather…", optionA: "Eat ice cream with ketchup", optionB: "Fries dipped in honey" },
  { statement: "Would you rather…", optionA: "Drink soup with a fork", optionB: "Eat rice with a straw" },
  { statement: "Would you rather…", optionA: "Give up all snacks", optionB: "Only eat snacks" },
  { statement: "Would you rather…", optionA: "Eat burnt toast", optionB: "Undercooked noodles" },
  { statement: "Would you rather…", optionA: "Have a pet potato", optionB: "A talking cabbage" },
  
  // Life Experiments
  { statement: "Would you rather…", optionA: "Wake up at 4 AM daily", optionB: "Go to bed at 3 AM daily" },
  { statement: "Would you rather…", optionA: "No internet for one day", optionB: "No music for one day" },
  { statement: "Would you rather…", optionA: "Live with a talking mirror", optionB: "A complaining alarm clock" },
  { statement: "Would you rather…", optionA: "Have invisible eyebrows", optionB: "Neon green eyebrows" },
  { statement: "Would you rather…", optionA: "Talk to animals", optionB: "Read minds but only random thoughts" },
  
  // Socially Weird
  { statement: "Would you rather…", optionA: "Accidentally compliment a stranger's shoe loudly", optionB: "Mix up someone's name publicly" },
  { statement: "Would you rather…", optionA: "Dance every time your partner says your name", optionB: "Wink every time they ask a question" },
  { statement: "Would you rather…", optionA: "Wear matching banana costumes in public", optionB: "Do a dramatic slow-motion walk" },
  { statement: "Would you rather…", optionA: "Introduce yourself with jazz hands", optionB: "Salute everyone dramatically" },
  { statement: "Would you rather…", optionA: "Sing everything you say for an hour", optionB: "Walk with a bounce for an hour" },
  
  // Couple-Themed
  { statement: "Would you rather…", optionA: "Let your partner choose your outfit for a day", optionB: "Let them choose all your meals" },
  { statement: "Would you rather…", optionA: "Talk in emojis for an hour", optionB: "Communicate only with animal sounds" },
  { statement: "Would you rather…", optionA: "Share one giant sweater", optionB: "Be tied together by a soft ribbon for 1 hour" },
  { statement: "Would you rather…", optionA: "Let partner control the TV for a day", optionB: "Control the playlist for a day" },
  { statement: "Would you rather…", optionA: "Do a trust fall", optionB: "Let them draw something on your forehead with eyeliner" },
  { statement: "Would you rather…", optionA: "Swap phones (no opening apps)", optionB: "Swap slippers" },
  { statement: "Would you rather…", optionA: "Cook together blindfolded (one person only)", optionB: "Both cook left-handed" },
  { statement: "Would you rather…", optionA: "Let partner pick your next hairstyle", optionB: "Your next hobby" },
  { statement: "Would you rather…", optionA: "Do each other's intro in a video", optionB: "Act like each other for 2 minutes" },
  { statement: "Would you rather…", optionA: "Talk like each other for 10 minutes", optionB: "Mimic each other's walk" },
  
  // Extreme but funny
  { statement: "Would you rather…", optionA: "Fight a giant fake spider", optionB: "A suspiciously fast cockroach" },
  { statement: "Would you rather…", optionA: "Wear a chicken suit to a grocery store", optionB: "Do karaoke in public" },
  { statement: "Would you rather…", optionA: "Live one day without sitting", optionB: "Live one day without using hands" },
  { statement: "Would you rather…", optionA: "Have your hair scream 'AARGH!' when combed", optionB: "Your socks shout 'HI!' when worn" },
  { statement: "Would you rather…", optionA: "Be stuck in a loop saying 'Oops!' every time you move", optionB: "Say 'Yay!' every time you stop" },
  
  // Extra goofy
  { statement: "Would you rather…", optionA: "Only turn left when walking", optionB: "Only hop on one leg for 10 minutes" },
  { statement: "Would you rather…", optionA: "Wear 5 hats stacked", optionB: "10 watches at once" },
  { statement: "Would you rather…", optionA: "Have a personal background music track", optionB: "A laugh track" },
  { statement: "Would you rather…", optionA: "Be followed by a tiny cloud", optionB: "A tiny butterfly" },
  { statement: "Would you rather…", optionA: "Have a suitcase that screams when zipped", optionB: "Shoes that squeak rhythmically" },
  
  // Relationship Growth
  { statement: "Would you rather…", optionA: "Do a random act of kindness", optionB: "Receive one" },
  { statement: "Would you rather…", optionA: "Tell one deep thought", optionB: "One embarrassing story" },
  { statement: "Would you rather…", optionA: "Choose one new habit", optionB: "Drop one old habit" },
  { statement: "Would you rather…", optionA: "Compliment your partner", optionB: "Compliment a stranger" },
  { statement: "Would you rather…", optionA: "Pick an adventure: cook together", optionB: "Walk together" }
];

interface CurrentRound {
  statement: string;
  optionA: string;
  optionB: string;
  aChoice: string | null;
  bChoice: string | null;
  createdAt: any;
}

export default function WouldYouRatherPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<CurrentRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [compatibility, setCompatibility] = useState(0);
  const [reaction, setReaction] = useState("");
  const [challenge, setChallenge] = useState("");

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
    return doc(firestore, `spaces/${spaceSlug}/games`, 'would-you-rather');
  }, [firestore, spaceSlug]);

  // Listen for game updates
  useEffect(() => {
    if (!gameDocRef || !currentMemberId || !partnerId) return;
    
    const unsubscribe = onSnapshot(gameDocRef, (doc) => {
      setLoading(false);
      
      if (doc.exists()) {
        const data = doc.data() as CurrentRound;
        setCurrentRound(data);
        
        // Check if both players have made choices
        if (data.aChoice && data.bChoice) {
          setShowReveal(true);
          
          // Calculate compatibility (random for fun)
          const comp = Math.floor(Math.random() * 40) + 50; // 50-90%
          setCompatibility(comp);
          
          // Select random reaction and challenge
          const randomReaction = reactionLines[Math.floor(Math.random() * reactionLines.length)];
          const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
          
          setReaction(randomReaction);
          setChallenge(randomChallenge);
        }
      } else {
        // No game exists, create a new one
        startNewRound();
      }
    });
    
    return () => unsubscribe();
  }, [gameDocRef, currentMemberId, partnerId]);

  const startNewRound = async () => {
    if (!gameDocRef || !currentMemberId || !partnerId) return;
    
    try {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      
      await setDoc(gameDocRef, {
        statement: randomPrompt.statement,
        optionA: randomPrompt.optionA,
        optionB: randomPrompt.optionB,
        aChoice: null,
        bChoice: null,
        createdAt: new Date()
      });
      
      setSelectedChoice(null);
      setShowReveal(false);
    } catch (error) {
      console.error("Error starting new round:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not start a new round. Please try again."
      });
    }
  };

  const makeChoice = async (choice: 'A' | 'B') => {
    if (!gameDocRef || !currentMemberId || !partnerId || !currentRound || isSubmitting) return;
    
    setIsSubmitting(true);
    setSelectedChoice(choice);
    
    try {
      // Determine which field to update based on member ID
      const isPlayerA = currentMemberId < partnerId; // Consistent way to determine player roles
      const choiceField = isPlayerA ? 'aChoice' : 'bChoice';
      const choiceValue = choice === 'A' ? currentRound.optionA : currentRound.optionB;
      
      await updateDoc(gameDocRef, {
        [choiceField]: choiceValue
      });
    } catch (error) {
      console.error("Error making choice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not submit your choice. Please try again."
      });
      setSelectedChoice(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetGame = async () => {
    await startNewRound();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-headline font-bold">Would You Rather?</h1>
            <p className="text-muted-foreground font-caption mt-1">A fun game for couples</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/space/${spaceSlug}/games`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Link>
          </Button>
        </div>

        {!showReveal ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {currentRound?.statement || "Would you rather..."}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentRound ? (
                <>
                  <div className="space-y-4">
                    <Button 
                      className="w-full h-20 text-lg font-bold py-6"
                      variant={selectedChoice === 'A' ? "default" : "outline"}
                      onClick={() => makeChoice('A')}
                      disabled={isSubmitting || !!selectedChoice}
                    >
                      {isSubmitting && selectedChoice === 'A' ? (
                        <Loader2 className="animate-spin mr-2" />
                      ) : null}
                      {currentRound.optionA}
                    </Button>
                    
                    <div className="text-center font-bold text-xl">OR</div>
                    
                    <Button 
                      className="w-full h-20 text-lg font-bold py-6"
                      variant={selectedChoice === 'B' ? "default" : "outline"}
                      onClick={() => makeChoice('B')}
                      disabled={isSubmitting || !!selectedChoice}
                    >
                      {isSubmitting && selectedChoice === 'B' ? (
                        <Loader2 className="animate-spin mr-2" />
                      ) : null}
                      {currentRound.optionB}
                    </Button>
                  </div>
                  
                  {selectedChoice && (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="font-caption">Waiting for your partner to make their choice...</p>
                      <div className="mt-2 flex justify-center">
                        <Loader2 className="animate-spin" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto mb-4" />
                  <p>Loading game...</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={startNewRound}>
                Start New Dilemma
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Results Are In!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-bold">{compatibility}% in sync today!</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <div className="font-bold mb-2">You chose:</div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    {currentRound?.aChoice}
                  </div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="font-bold mb-2">Partner chose:</div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    {currentRound?.bChoice}
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="font-caption italic">"{reaction}"</p>
              </div>
              
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center">
                <div className="font-bold mb-2 flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Challenge
                </div>
                <p>{challenge}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={resetGame}>
                Next Dilemma!
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  );
}