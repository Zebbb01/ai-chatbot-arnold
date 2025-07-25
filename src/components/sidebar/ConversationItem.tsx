// src/components/sidebar/ConversationItem.tsx
'use client';

import Link from "next/link";
import { Pin } from "lucide-react";
import { SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { ConversationItemProps } from "@/types/conversation";
import { truncateTitle } from "@/utils/conversation";
import { ConversationActions } from "./ConversationActions";
import { ConversationEditMode } from "./ConversationEditMode";

export function ConversationItem({
  conversation,
  isActive,
  isEditing,
  editTitle,
  isLoading,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onTogglePin,
  onStartEdit,
  onDelete,
}: ConversationItemProps) {
  return (
    <SidebarMenuSubItem>
      <div className="flex items-center gap-1 w-full group">
        {isEditing ? (
          <ConversationEditMode
            editTitle={editTitle}
            isLoading={isLoading}
            onEditTitleChange={onEditTitleChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
          />
        ) : (
          <>
            <SidebarMenuSubButton
              asChild
              isActive={isActive}
              className="flex-1 group/item rounded-2xl"
            >
              <Link
                href={`/chat/${conversation.id}`}
                title={conversation.title}
                className="block w-full"
              >
                <div className="flex items-center gap-1">
                  {conversation.isPinned && (
                    <Pin className="size-3 text-orange-500 flex-shrink-0" />
                  )}
                  <span className="block truncate text-sm text-muted-foreground group-hover/item:text-foreground group-data-[active=true]/item:text-foreground transition-colors">
                    {truncateTitle(conversation.title)}
                  </span>
                </div>
              </Link>
            </SidebarMenuSubButton>

            <ConversationActions
              conversation={conversation}
              isLoading={isLoading}
              onTogglePin={onTogglePin}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
            />
          </>
        )}
      </div>
    </SidebarMenuSubItem>
  );
}