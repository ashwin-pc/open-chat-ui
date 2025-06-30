import React, { useState } from 'react';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { ChangelogSection } from './changelog-section';
import { LinksSection } from './links-section';
import { ContributorsSection } from './contributors-section';

export function ProjectInfoDialog() {
  const [open, setOpen] = useState(false);

  const toggleDialog = () => setOpen(!open);

  // Register global hotkey for opening project info
  useHotkeys('project-info-dialog', {
    key: 'i',
    description: 'Toggle project info dialog',
    scope: 'Global',
    callback: toggleDialog,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Info className="h-4 w-4" />
          <span className="sr-only">Project Information</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Project Information</DialogTitle>
          <DialogDescription>
            Learn about recent updates, important links, and the amazing team behind this project
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* What's New Section */}
          <ChangelogSection />

          <Separator />

          {/* Links Section */}
          <LinksSection />

          <Separator />

          {/* Contributors Section */}
          <ContributorsSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}