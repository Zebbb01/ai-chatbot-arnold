// src/components/chat/ChatHeader.tsx
import React from 'react';
import { MessageSquare, Settings, Menu } from 'lucide-react';

export default function ChatHeader() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Arnold</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</p>
          </div>
        </div>
      </div>
      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    </header>
  );
}