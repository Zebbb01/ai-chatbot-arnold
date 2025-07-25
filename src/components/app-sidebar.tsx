// src/components/app-sidebar.tsx - Final simplified version with custom hook
'use client';

import * as React from "react";
import { PlusCircle, History } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { useConversations } from "@/hooks/sidebar/useConversations";
import { ConversationList, DeleteConfirmationDialog } from "./sidebar";

/**
 * Main sidebar component for the application
 * Provides navigation and conversation management
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  // Use custom hook for conversation management
  const {
    conversations,
    editingId,
    editTitle,
    deleteDialogId,
    isLoading,
    handleTogglePin,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleEditTitleChange,
  } = useConversations();

  return (
    <>
      <Sidebar variant="floating" className="p-0" {...props}>
        {/* Header with logo and app info */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="w-12 h-12 relative rounded-full overflow-hidden">
                    <Image
                      src="/img/logo.png"
                      alt="Arnold Logo"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-full"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">Arnold</span>
                    <span className="text-xs text-muted-foreground">v1.0.0</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Main content area */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu className="gap-2">
              {/* New Chat Button */}
              <SidebarMenuItem>
                <SidebarMenuButton className="font-medium rounded-2xl" asChild>
                  <Link href="/">
                    <PlusCircle className="mr-2 size-4" />
                    New Chat
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Conversation List or Sign-in prompt */}
              {status === 'authenticated' ? (
                <ConversationList
                  conversations={conversations}
                  currentPath={pathname}
                  editingId={editingId}
                  editTitle={editTitle}
                  isLoading={isLoading}
                  onEditTitleChange={handleEditTitleChange}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onTogglePin={handleTogglePin}
                  onStartEdit={handleStartEdit}
                  onDelete={handleDeleteRequest}
                />
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled className="font-medium cursor-not-allowed">
                    <History className="mr-2 size-4" />
                    Recent
                  </SidebarMenuButton>
                  <div className="px-4 py-2 text-xs text-muted-foreground">
                    Sign in to view your chat history.
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer with user info */}
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!deleteDialogId}
        conversationId={deleteDialogId}
        isLoading={isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}