// src/components/sidebar/ConversationEditMode.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConversationEditModeProps {
  editTitle: string;
  isLoading: boolean;
  onEditTitleChange: (title: string) => void;
  onSaveEdit: () => Promise<void>;
  onCancelEdit: () => void;
}

export function ConversationEditMode({
  editTitle,
  isLoading,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
}: ConversationEditModeProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit();
    }
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <div className="flex items-center gap-1 w-full">
      <Input
        value={editTitle}
        onChange={(e) => onEditTitleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-6 text-xs"
        autoFocus
        disabled={isLoading}
      />
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={onSaveEdit} 
        disabled={isLoading || !editTitle.trim()}
        className="h-6 w-6 p-0"
      >
        ✓
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={onCancelEdit}
        className="h-6 w-6 p-0"
        disabled={isLoading}
      >
        ✕
      </Button>
    </div>
  );
}