// components/MobileMenu.tsx
import { Sheet, SheetContent, SheetHeader } from './ui/sheet';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { BranchSelector } from './branch-selector';
import { SettingsIcon } from 'lucide-react';
import { ShortcutsDialog } from './shortcuts-dialog';
import { ChatThread } from '@/lib/types';
import { ChatContextType } from '@/contexts/chat-context';

interface MobileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentThread: ChatThread;
  currentThreadId: string;
  actions: ChatContextType['actions'];
  setIsShortcutsOpen: (open: boolean) => void;
  openSettings: () => void;
}

export function MobileMenu({
  isOpen,
  onOpenChange,
  currentThread,
  currentThreadId,
  actions,

  setIsShortcutsOpen,
  openSettings,
}: MobileMenuProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <div className="grid grid-cols-3 gap-4 mt-4 justify-items-center">
            <ShortcutsDialog open={false} onOpenChange={setIsShortcutsOpen} />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={openSettings}>
              <SettingsIcon className="w-6 h-6" />
            </Button>
          </div>
        </SheetHeader>
        <div className="mt-4">
          <BranchSelector
            currentBranchId={currentThread.currentBranchId}
            branches={currentThread.branches}
            onBranchChange={(branchId) => actions.switchBranch(currentThreadId, branchId)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
