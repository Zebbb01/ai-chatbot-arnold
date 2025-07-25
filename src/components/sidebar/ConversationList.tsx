// src/components/sidebar/ConversationList.tsx
'use client';

import { History } from "lucide-react";
import { 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarMenuSub 
} from "@/components/ui/sidebar";
import { ConversationListProps } from "@/types/conversation";
import { sortConversations, isConversationActive } from "@/utils/conversation";
import { ConversationItem } from "./ConversationItem";

export function ConversationList({
  conversations,
  currentPath,
  editingId,
  editTitle,
  isLoading,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onTogglePin,
  onStartEdit,
  onDelete,
}: ConversationListProps) {
  const sortedConversations = sortConversations(conversations);

  if (sortedConversations.length === 0) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="font-medium rounded-2xl">
        <History className="mr-2 size-4" />
        Recent ({sortedConversations.length})
      </SidebarMenuButton>
      <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
        {sortedConversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={isConversationActive(conversation.id, currentPath)}
            isEditing={editingId === conversation.id}
            editTitle={editTitle}
            isLoading={isLoading}
            onEditTitleChange={onEditTitleChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onTogglePin={onTogglePin}
            onStartEdit={onStartEdit}
            onDelete={onDelete}
          />
        ))}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
}