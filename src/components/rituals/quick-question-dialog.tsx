
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { RefreshCw } from 'lucide-react';

interface QuickQuestionDialogProps {
  spaceId: string;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const questions = [
  // Routine & Day Check
  'What’s one thing you want from today?',
  'What’s one thing you want to avoid today?',
  'What’s the best moment you’ve had today so far?',
  'What’s one thing you’re looking forward to?',
  'What’s one small win you had today?',
  'Is there something you want to finish today?',
  'How’s your energy right now?',
  'What would make this day feel a bit easier?',
  'What’s something small you enjoyed today?',
  'What’s one thing you need a reminder for?',
  // Mood & Check-in
  'What’s your current mood in one word?',
  'What’s one thing that lifted your mood today?',
  'What’s one thing that stressed you a little?',
  'What’s something calming you could do today?',
  'What’s one thing you’re grateful for right now?',
  'What’s one thought that’s on your mind?',
  'What’s the kindest thing someone did for you recently?',
  'What do you need more of this week?',
  'What do you need less of this week?',
  'What’s one thing you’d like support with?',
  // Fun & Light
  'If you could eat one snack right now, what would it be?',
  'What song fits your mood today?',
  'If the day was a color, what color would it be?',
  'What’s the funniest thing that happened recently?',
  'What’s a random fact stuck in your head today?',
  'What emoji describes your vibe today?',
  'If you had one free hour now, how would you spend it?',
  'What’s one tiny thing that made you smile lately?',
  'If today had a theme, what would it be?',
  'What’s a small treat you’d enjoy today?',
  // Reflection & Growth
  'What’s something you learned this week?',
  'What’s something you handled well recently?',
  'Is there something you want to improve this month?',
  'What’s a habit you want to build?',
  'What’s a habit you want to reduce?',
  'What’s one thing you’re proud of from this week?',
  'What feels challenging right now?',
  'What’s one thing you’d like to understand better?',
  'What’s one mistake that taught you something?',
  'What’s something you want future-you to remember?',
  // Connection & Collaboration
  'What’s something we should plan soon?',
  'What’s one small thing we can do together this week?',
  'What’s a task you want to share this week?',
  'What’s a moment you appreciated recently?',
  'What’s one thing I can do to make your day lighter?',
  'What’s something we’re doing well together?',
  'What’s something we can improve as a team?',
  'What’s one idea you want us to explore?',
  'What’s a tiny ritual we should add to our routine?',
  'What’s something you want us to celebrate soon?',
  // Random & Creative
  'If today had background music, what would it be?',
  'What’s a place you want to visit one day?',
  'If you had a reset button for one thing today, what would you reset?',
  'What’s one prediction you have for tomorrow?',
  'If you could teleport anywhere for 10 minutes, where would you go?',
  'What’s something you wish you knew earlier in life?',
  'If your mood was a weather type, what would it be?',
  'What’s one question you wish someone asked you today?',
  'What’s something you want to try soon?',
  'What’s a dream you haven’t talked about yet?',
];

export function QuickQuestionDialog({
  spaceId,
  authorId,
  open,
  onOpenChange,
}: QuickQuestionDialogProps) {
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const pickNewQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * questions.length);
    setQuestion(questions[randomIndex]);
  }, []);

  useEffect(() => {
    // When the dialog opens, pick a new random question.
    if (open) {
      pickNewQuestion();
      setAnswer(''); // Also reset the answer
    }
  }, [open, pickNewQuestion]);

  const handleShareAnswer = async () => {
    if (!answer.trim()) {
       toast({ variant: 'destructive', title: 'Empty Answer', description: 'Please write a short answer.' });
       return;
    }
    if (!authorId) return;

    setIsLoading(true);
    const contentRef = collection(firestore, `spaces/${spaceId}/content`);
    const newAnswer = {
      spaceId,
      authorMemberId: authorId,
      type: 'quick_question_response',
      payload: {
        question: question,
        answer: answer,
      },
      visibility: 'members',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      addDocumentNonBlocking(contentRef, newAnswer);
      toast({
        title: 'Answer Shared!',
        description: 'Your answer has been shared with your partner.',
      });
      setAnswer('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing answer:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not share your answer. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>A Quick Question for Today</DialogTitle>
          <div className="flex items-start gap-2 pt-2">
            <DialogDescription className="flex-1">
              {question}
            </DialogDescription>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={pickNewQuestion}>
                <RefreshCw className="w-4 h-4"/>
                <span className="sr-only">New question</span>
            </Button>
          </div>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleShareAnswer}
            disabled={isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share Answer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
