import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

export function DropOverlay() {
  return (
    <div className="absolute bg-primary/40 backdrop-blur-sm z-50 items-center justify-center flex flex-col inset-0">
      <Card className="shadow-lg">
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-6">
          <UploadCloud size={48} className="text-primary" />
          <h3 className="text-xl font-semibold text-primary">Drop files to attach</h3>
          <p className="text-center text-sm text-muted-foreground">Release the files to attach them to your message.</p>
        </CardContent>
      </Card>
    </div>
  );
}
