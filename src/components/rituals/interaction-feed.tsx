
'use client';

import { useInteractions, InteractionDocument, CheckInPayload, GratitudePayload, QuickQuestionPayload } from '@/hooks/useInteractions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Smile } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface InteractionFeedProps {
  spaceId: string;
  currentMemberId: string | null;
}

export function InteractionFeed({ spaceId, currentMemberId }: InteractionFeedProps) {
  const { data: interactions, isLoading } = useInteractions(spaceId);

  const getMemberName = (id: string) => id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const renderPayload = (interaction: InteractionDocument) => {
    switch (interaction.type) {
      case 'check-in':
        const checkIn = interaction.payload as CheckInPayload;
        return (
          <>
            <p className="text-2xl">{checkIn.mood}</p>
            {checkIn.text && <p className="mt-2 text-sm text-muted-foreground italic">"{checkIn.text}"</p>}
          </>
        );
      case 'gratitude':
        const gratitude = interaction.payload as GratitudePayload;
        return <p className="text-sm text-muted-foreground">{gratitude.message}</p>;
      case 'quick_question_response':
        const question = interaction.payload as QuickQuestionPayload;
        return (
          <div className="text-sm">
            <p className="font-medium text-foreground">{question.question}</p>
            <p className="mt-1 text-muted-foreground italic">"{question.answer}"</p>
          </div>
        );
      default:
        return null;
    }
  };
  
  const getIcon = (type: InteractionDocument['type']) => {
    switch (type) {
        case 'check-in': return <Smile className="w-4 h-4" />;
        case 'gratitude': return <Heart className="w-4 h-4 text-red-500" />;
        case 'quick_question_response': return <MessageCircle className="w-4 h-4" />;
    }
  }

  const renderInteraction = (interaction: InteractionDocument) => {
    const authorName = getMemberName(interaction.authorMemberId);
    const isCurrentUser = interaction.authorMemberId === currentMemberId;

    return (
      <div key={interaction.id} className="flex items-start gap-3">
        <Avatar className="w-8 h-8 border-2 border-transparent">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${interaction.authorMemberId}`} />
            <AvatarFallback>{authorName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{authorName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {getIcon(interaction.type)}
                    <span>{interaction.createdAt ? formatDistanceToNow(interaction.createdAt.toDate(), { addSuffix: true }) : 'just now'}</span>
                </div>
            </div>
            <div className="mt-2 rounded-lg bg-muted/50 p-3">
                {renderPayload(interaction)}
            </div>
        </div>
      </div>
    );
  };
  
  if (isLoading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Activity Feed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                      </div>
                  </div>
                   <div className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                      </div>
                  </div>
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>Recent check-ins and shared moments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {interactions && interactions.length > 0 ? (
          interactions.map(renderInteraction)
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity yet. Be the first!</p>
        )}
      </CardContent>
    </Card>
  );
}
