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
import { ConversationList, DeleteConfirmationDialog } from "./sidebar"; // Assuming ConversationList is imported from here

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

  const isAuthenticated = status === 'authenticated';
  const isPendingAuth = status === 'loading';

  return (
    <>
      {/* Ensure the main Sidebar itself takes full height and allows its content to flex */}
      <Sidebar variant="floating" className="p-0 flex flex-col h-full" {...props}>
        {/* Header with logo and app info - FIXED AT TOP */}
        <SidebarHeader className="flex-shrink-0"> {/* flex-shrink-0 prevents it from shrinking */}
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

        {/* Main content area - THIS WILL BE THE SCROLLABLE PART */}
        {/* Changed SidebarContent to be the flex-grow container */}
        <SidebarContent className="flex flex-col flex-grow overflow-hidden">
          <SidebarGroup className="flex flex-col h-full">
            <SidebarMenu className="gap-2 flex flex-col h-full">
              {/* New Chat Button: Conditionally disabled */}
              <SidebarMenuItem className="flex-shrink-0">
                <SidebarMenuButton
                  className="font-medium rounded-2xl"
                  asChild
                  disabled={!isAuthenticated || isPendingAuth} // Disable if not authenticated OR still loading session
                  aria-disabled={!isAuthenticated || isPendingAuth}
                >
                  {isAuthenticated ? (
                    <Link href="/">
                      <PlusCircle className="mr-2 size-4" />
                      New Chat
                    </Link>
                  ) : (
                    // Render as a div that looks like a button when disabled
                    <div className="flex items-center">
                      <PlusCircle className="mr-2 size-4" />
                      New Chat
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Conversation List or Sign-in prompt - THIS PART WILL SCROLL */}
              {status === 'authenticated' ? (
                // Wrap ConversationList in a div that handles scrolling
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
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
                </div>
              ) : (
                // Wrap the sign-in prompt in a scrollable div as well, if it gets lengthy
                <div className="flex-grow overflow-y-auto pr-2">
                  <SidebarMenuItem className="flex-shrink-0">
                    <SidebarMenuButton disabled className="font-medium cursor-not-allowed">
                      <History className="mr-2 size-4" />
                      Recent
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <div className="px-4 py-2 text-xs text-muted-foreground">
                    Sign in to view your chat history.
                  </div>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer with user info - FIXED AT BOTTOM */}
        <SidebarFooter className="flex-shrink-0"> {/* flex-shrink-0 prevents it from shrinking */}
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