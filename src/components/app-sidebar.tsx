// src/components/app-sidebar.tsx
'use client';

import * as React from "react";
import { PlusCircle, History, Pin, PinOff, Edit2, Trash2, MoreVertical } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image"; // Import the Image component
import Link from "next/link"; // Ensure Link is imported

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavUser } from "./nav-user";

interface Conversation {
  id: string;
  title: string;
  isPinned?: boolean;
  createdAt?: string;
}

// Utility function to truncate text
const truncateTitle = (title: string, maxLength: number = 35): string => {
  if (title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength).trim() + "...";
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [deleteDialogId, setDeleteDialogId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Function to fetch conversations
  const fetchConversations = React.useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/conversations?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    }
  }, []);

  // Effect to fetch conversations when session is loaded or changes
  React.useEffect(() => {
    if (status === 'authenticated' && session.user?.id) {
      fetchConversations(session.user.id);
    } else {
      setConversations([]);
    }
  }, [status, session, fetchConversations, pathname]);

  const handleNewChat = () => {
    router.push('/');
  };

  // Pin/Unpin conversation
  const handleTogglePin = async (conversationId: string, currentPinnedState: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinnedState }),
      });

      if (!res.ok) throw new Error('Failed to toggle pin');

      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, isPinned: !currentPinnedState }
            : conv
        )
      );
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing
  const handleStartEdit = (conversationId: string, currentTitle: string) => {
    setEditingId(conversationId);
    setEditTitle(currentTitle);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/conversations/${editingId}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      if (!res.ok) throw new Error('Failed to rename conversation');

      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === editingId
            ? { ...conv, title: editTitle.trim() }
            : conv
        )
      );

      setEditingId(null);
      setEditTitle("");
    } catch (error) {
      console.error('Error renaming conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  // Delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete conversation');

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      // If we're currently viewing this conversation, redirect to home
      if (pathname.includes(conversationId)) {
        router.push('/');
      }

      setDeleteDialogId(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort conversations: pinned first, then by creation date
  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => {
      // Pinned conversations first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then by creation date (newest first)
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [conversations]);

  return (
    <>
      <Sidebar variant="floating" className="p-0" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="w-12 h-12 relative rounded-full overflow-hidden">
                    <Image
                      src="/img/logo.png"
                      alt="Logo"
                      fill // Use fill to make the image fill its parent
                      style={{ objectFit: 'cover' }} // Ensure the image covers the area
                      className="rounded-full" // Apply rounded-full directly to the image
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Add sizes for better optimization
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">Arnold</span>
                    <span className="">v1.0.0</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNewChat} className="font-medium" asChild>
                  <Link href="/">
                    <PlusCircle className="mr-2 size-4" />
                    New Chat
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Conditional Rendering based on Authentication Status */}
              {status === 'authenticated' ? (
                <>
                  {sortedConversations.length > 0 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton className="font-medium">
                        <History className="mr-2 size-4" />
                        Recent ({sortedConversations.length})
                      </SidebarMenuButton>
                      <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                        {sortedConversations.map((convo) => (
                          <SidebarMenuSubItem key={convo.id}>
                            <div className="flex items-center gap-1 w-full group">
                              {editingId === convo.id ? (
                                <div className="flex items-center gap-1 w-full">
                                  <Input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit();
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    className="h-6 text-xs"
                                    autoFocus
                                  />
                                  <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={isLoading}>
                                    ✓
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                    ✕
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname.includes(convo.id)}
                                    className="flex-1 group/item"
                                  >
                                    <Link
                                      href={`/chat/${convo.id}`}
                                      title={convo.title}
                                      className="block w-full"
                                    >
                                      <div className="flex items-center gap-1">
                                        {convo.isPinned && (
                                          <Pin className="size-3 text-orange-500 flex-shrink-0" />
                                        )}
                                        <span className="block truncate text-sm text-muted-foreground group-hover/item:text-foreground group-data-[active=true]/item:text-foreground transition-colors">
                                          {truncateTitle(convo.title)}
                                        </span>
                                      </div>
                                    </Link>
                                  </SidebarMenuSubButton>

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
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem
                                        onClick={() => handleTogglePin(convo.id, convo.isPinned || false)}
                                        className="text-xs"
                                      >
                                        {convo.isPinned ? (
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
                                        onClick={() => handleStartEdit(convo.id, convo.title)}
                                        className="text-xs"
                                      >
                                        <Edit2 className="mr-2 size-3" />
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => setDeleteDialogId(convo.id)}
                                        className="text-xs text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="mr-2 size-3" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </div>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  )}
                </>
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

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialogId} onOpenChange={(open) => !open && setDeleteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogId && handleDeleteConversation(deleteDialogId)}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}