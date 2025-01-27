import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { CreativityLevel } from '@/lib/types';
import { useChatContext } from '@/contexts/chat-context';

const creativityDescriptions: Record<CreativityLevel, string> = {
  [CreativityLevel.PRECISE]: 'More deterministic and focused responses, best for factual or technical questions',
  [CreativityLevel.BALANCED]: 'Balance between creativity and precision, good for general conversation',
  [CreativityLevel.CREATIVE]: 'More varied and creative responses, better for brainstorming and creative tasks'
};

export function CreativitySelector() {
  const { creativityLevel, setCreativityLevel } = useChatContext();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-center text-med font-medium text-muted-foreground">
            Choose how you want the AI to respond
          </h3>
          <div className="flex justify-between gap-4">
            {Object.values(CreativityLevel).map((level) => (
              <Button
                key={level}
                variant={creativityLevel === level ? "default" : "outline"}
                className="flex-1"
                onClick={() => setCreativityLevel(level)}
              >
                {level.charAt(0) + level.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
          <p className="text-med text-center text-muted-foreground">
            {creativityDescriptions[creativityLevel]}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
