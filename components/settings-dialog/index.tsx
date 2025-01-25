'use client';

import React, { useState } from 'react';
import { SettingsIcon, Terminal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ResponsiveDialog } from '../responsive-dialog';
import { SystemPromptsManager } from './system-prompt-manager';
import { useChatContext } from '@/contexts/chat-context';

interface Settings {
  cmdToSend: boolean;
  // Add other settings here as needed
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { settings, updateSettings } = useChatContext();

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="Settings"
      trigger={
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <SettingsIcon className="w-6 h-6" />
          <span className="sr-only">Settings</span>
        </Button>
      }
    >
      <Tabs defaultValue="general" className="flex flex-col sm:flex-row h-full">
        <TabsList className="h-auto sm:h-full sm:w-48 flex flex-row sm:flex-col justify-start border-b sm:border-r sm:border-b-0">
          <TabsTrigger value="general" className="flex-1 sm:flex-initial sm:w-full justify-start">
            General
          </TabsTrigger>
          <TabsTrigger value="system-prompts" className="flex-1 sm:flex-initial sm:w-full justify-start">
            System Prompts
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-auto">
          <TabsContent value="general" className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="use-cmd-enter" className="flex flex-col space-y-1">
                  <span>Use Cmd + Enter to Send</span>
                  <span className="text-sm text-muted-foreground">
                    When disabled, pressing Enter will send the message
                  </span>
                </Label>
                <Switch
                  id="use-cmd-enter"
                  checked={settings.cmdToSend}
                  onCheckedChange={(checked: boolean) => updateSettings({ cmdToSend: checked })}
                />
              </div>
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>More settings coming soon!</AlertTitle>
                <AlertDescription>
                  We are working on adding more customization options. Stay tuned for updates.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          <TabsContent value="system-prompts" className="p-0 h-full mt-0">
            <SystemPromptsManager />
          </TabsContent>
        </div>
      </Tabs>
    </ResponsiveDialog>
  );
}
