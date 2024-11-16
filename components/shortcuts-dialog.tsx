import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { useHotkeyList } from '@/hooks/use-hotkeys';
import { groupBy } from '@/lib/utils';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const shortcuts = useHotkeyList();
  const groupedShortcuts = groupBy(shortcuts, 'scope');

  // TODO: detect OS
  // const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator?.platform);
  const isMac = true;

  const formatShortcut = (shortcut: { key: string; windowsKey?: string; macKey?: string }) => {
    // if (isMac && shortcut.macKey) return shortcut.macKey;
    // if (!isMac && shortcut.windowsKey) return shortcut.windowsKey;
    return shortcut.key;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(true)}>
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Keyboard shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Available keyboard shortcuts for {isMac ? 'macOS' : 'Windows/Linux'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {groupedShortcuts.map((group) => (
            <div key={group.scope} className="space-y-2">
              <h3 className="font-semibold text-sm">{group.scope}</h3>
              <div className="grid gap-2">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{formatShortcut(shortcut)}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
