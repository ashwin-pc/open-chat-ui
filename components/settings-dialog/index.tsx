'use client';

import React, { useState } from 'react';
import { SettingsIcon, Terminal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ResponsiveDialog } from '../responsive-dialog';
import { SystemPromptsManager } from './system-prompt-manager';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);

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
      <Tabs defaultValue="system-prompts" className="flex flex-col sm:flex-row h-full">
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
            {/* TODO */}
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Under Construction!</AlertTitle>
              <AlertDescription>
                Settings is still under construction. Stay tuned for some customizability coming soon.
              </AlertDescription>
            </Alert>
          </TabsContent>
          <TabsContent value="system-prompts" className="p-0 h-full mt-0">
            <SystemPromptsManager />
          </TabsContent>
        </div>
      </Tabs>
    </ResponsiveDialog>
  );
}
