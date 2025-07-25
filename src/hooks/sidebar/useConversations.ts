// src/hooks/sidebar/useConversations.ts
import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Conversation } from '@/types/conversation';
import { ConversationService } from '@/services/conversationService';

export interface UseConversationsReturn {
  // State
  conversations: Conversation[];
  editingId: string | null;
  editTitle: string;
  deleteDialogId: string | null;
  isLoading: boolean;

  // Handlers
  handleTogglePin: (conversationId: string, currentPinnedState: boolean) => Promise<void>;
  handleStartEdit: (conversationId: string, currentTitle: string) => void;
  handleSaveEdit: () => Promise<void>;
  handleCancelEdit: () => void;
  handleDeleteRequest: (conversationId: string) => void;
  handleDeleteConfirm: (conversationId: string) => Promise<void>;
  handleDeleteCancel: () => void;
  handleEditTitleChange: (title: string) => void;
  fetchConversations: (userId: string) => Promise<void>;
}

/**
 * Custom hook for managing conversation state and operations
 */
export function useConversations(): UseConversationsReturn {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hooks
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  /**
   * Fetch conversations for the current user
   */
  const fetchConversations = useCallback(async (userId: string) => {
    try {
      const data = await ConversationService.fetchConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    }
  }, []);

  /**
   * Auto-fetch conversations when session changes
   */
  useEffect(() => {
    if (status === 'authenticated' && session.user?.id) {
      fetchConversations(session.user.id);
    } else {
      setConversations([]);
    }
  }, [status, session, fetchConversations, pathname]);

  /**
   * Pin/Unpin conversation handler
   */
  const handleTogglePin = useCallback(async (conversationId: string, currentPinnedState: boolean) => {
    setIsLoading(true);
    try {
      await ConversationService.togglePin(conversationId, !currentPinnedState);
      
      // Update local state optimistically
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, isPinned: !currentPinnedState }
            : conv
        )
      );
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Could emit error event here for toast notifications
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Edit conversation handlers
   */
  const handleStartEdit = useCallback((conversationId: string, currentTitle: string) => {
    setEditingId(conversationId);
    setEditTitle(currentTitle);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editTitle.trim()) return;

    setIsLoading(true);
    try {
      await ConversationService.renameConversation(editingId, editTitle.trim());

      // Update local state optimistically
      setConversations(prev =>
        prev.map(conv =>
          conv.id === editingId
            ? { ...conv, title: editTitle.trim() }
            : conv
        )
      );

      // Reset edit state
      setEditingId(null);
      setEditTitle("");
    } catch (error) {
      console.error('Error renaming conversation:', error);
      // Could emit error event here for toast notifications
    } finally {
      setIsLoading(false);
    }
  }, [editingId, editTitle]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
  }, []);

  /**
   * Delete conversation handlers
   */
  const handleDeleteRequest = useCallback((conversationId: string) => {
    setDeleteDialogId(conversationId);
  }, []);

  const handleDeleteConfirm = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      await ConversationService.deleteConversation(conversationId);

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      // If we're currently viewing this conversation, redirect to home
      if (pathname.includes(conversationId)) {
        router.push('/');
      }

      setDeleteDialogId(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      // Could emit error event here for toast notifications
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogId(null);
  }, []);

  /**
   * Edit title change handler
   */
  const handleEditTitleChange = useCallback((title: string) => {
    setEditTitle(title);
  }, []);

  return {
    // State
    conversations,
    editingId,
    editTitle,
    deleteDialogId,
    isLoading,

    // Handlers
    handleTogglePin,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleEditTitleChange,
    fetchConversations,
  };
}