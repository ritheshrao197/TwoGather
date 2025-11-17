
'use client';

import { useState, useMemo } from 'react';
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

interface QuickQuestionDialogProps {
  spaceId: string;
  authorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const questions = [
  "What's one thing you want today?",
  "One small win from yesterday?",
  "What's something you're looking forward to?",
  "What made you smile recently?",
  "What's a song you have on repeat?",
  "What's one thing you're grateful for right now?",
  "If you could be anywhere, where would you be?",
];

export function QuickQuestionDialog({
  spaceId,
  authorId,
  open,
  onOpenChange,
}: QuickQuestionDialogProps) {
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const dailyQuestion = useMemo(() => {
    // Get the day of the year (0-365)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now as any) - (start as any);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Use modulo to cycle through questions
    return questions[dayOfYear % questions.length];
  }, []);

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
        question: dailyQuestion,
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
          <DialogDescription className="pt-2">
            {dailyQuestion}
          </DialogDescription>
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
