'use client';

import React, { useState } from 'react';
import { SettingsIcon, Trash2, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ResponsiveDialog } from '../responsive-dialog';
import { SystemPromptsManager } from './system-prompt-manager';
import { useChatContext } from '@/contexts/chat-context';
import { useHotkeys } from '@/hooks/use-hotkeys';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { settings, actions } = useChatContext();
  useHotkeys('toggle-settings', {
    key: 'cmd+,',
    description: 'Toggle settings dialog',
    scope: 'Global',
    callback: () => setOpen((prev) => !prev),
  });

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
          <TabsTrigger value="chat-history" className="flex-1 sm:flex-initial sm:w-full justify-start">
            Chat History
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-auto">
          <TabsContent value="general" className="p-4 h-full">
            {settings.isIncognitoMode && (
              <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md flex items-center gap-2 text-sm">
                <EyeOff className="w-4 h-4" />
                <span>You are in incognito mode. Chat history will be deleted when you leave.</span>
              </div>
            )}
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
                  onCheckedChange={(checked: boolean) => actions.updateSettings({ cmdToSend: checked })}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="system-prompts" className="p-0 h-full mt-0">
            <SystemPromptsManager />
          </TabsContent>
          <TabsContent value="chat-history" className="p-3 h-full">
            <h2 className="text-lg font-semibold mb-4">Chat History Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-incognito" className="flex flex-col space-y-1">
                  <span>Enable Incognito Mode</span>
                  <span className="text-sm text-muted-foreground">
                    When enabled, a new incognito chat will be created that won&apos;t be saved to history
                  </span>
                </Label>
                <Switch
                  id="enable-incognito"
                  checked={settings.isIncognitoMode}
                  onCheckedChange={(checked: boolean) => {
                    actions.updateSettings({ isIncognitoMode: checked });
                  }}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-incognito" className="flex flex-col space-y-1">
                  <span>Delete entire history</span>
                  <span className="text-sm text-muted-foreground">Will delete entire chat threads from history.</span>
                </Label>
                <Button variant={'destructive'} onClick={() => actions.deleteEntireChatHistory()}>
                  <Trash2 /> Delete
                </Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </ResponsiveDialog>
  );
}
