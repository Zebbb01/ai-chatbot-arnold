// src/components/chat/ChatHeader.tsx
'use client';

import React from 'react';
import { MessageSquare, Sun, Moon } from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useTheme } from '@/context/ThemeProvider';
import Image from 'next/image';

const ChatHeader = React.memo(function ChatHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-13 h-11 relative rounded-full overflow-hidden mx-auto">
            <Image
              src="/img/arnold-removecrop.png"
              alt="Arnold Logo Preview"
              fill // Make the image fill its parent container
              style={{ objectFit: 'cover' }} // Ensure the image covers the area, maintaining aspect ratio
              className="rounded-full" // Apply rounded-full directly to the image
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Add sizes for optimization
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Arnold</h1>
            <p className="text-xs text-text-muted">AI Scheduling Assistant</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle Switch */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="theme-toggle" className="sr-only">Toggle theme</Label>
          <Switch
            id="theme-toggle"
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
            aria-label="Toggle dark mode"
          />
          {theme === 'light' ? (
            // Adjusted icon color to use theme variable
            <Sun className="w-5 h-5 text-muted-foreground" />
          ) : (
            // Adjusted icon color to use theme variable
            <Moon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>
    </header>
  );
});

export default ChatHeader;