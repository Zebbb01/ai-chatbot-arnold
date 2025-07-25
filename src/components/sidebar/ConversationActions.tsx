// src/components/sidebar/ConversationActions.tsx
'use client';

import { Pin, PinOff, Edit2, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConversationActionsProps } from "@/types/conversation";

export function ConversationActions({
  conversation,
  isLoading,
  onTogglePin,
  onStartEdit,
  onDelete,
}: ConversationActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={isLoading}
        >
          <MoreVertical className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 border-border">
        <DropdownMenuItem
          onClick={() => onTogglePin(conversation.id, conversation.isPinned || false)}
          className="text-xs"
        >
          {conversation.isPinned ? (
            <>
              <PinOff className="mr-2 size-3" />
              Unpin
            </>
          ) : (
            <>
              <Pin className="mr-2 size-3" />
              Pin
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStartEdit(conversation.id, conversation.title)}
          className="text-xs"
        >
          <Edit2 className="mr-2 size-3" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(conversation.id)}
          className="text-xs text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 size-3" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}