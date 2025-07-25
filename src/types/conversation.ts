// src/types/conversation.ts
export interface Conversation {
  id: string;
  title: string;
  isPinned?: boolean;
  createdAt?: string;
}

export interface ConversationActionsProps {
  conversation: Conversation;
  isLoading: boolean;
  onTogglePin: (id: string, currentState: boolean) => Promise<void>;
  onStartEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  isLoading: boolean;
  onEditTitleChange: (title: string) => void;
  onSaveEdit: () => Promise<void>;
  onCancelEdit: () => void;
  onTogglePin: (id: string, currentState: boolean) => Promise<void>;
  onStartEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export interface ConversationListProps {
  conversations: Conversation[];
  currentPath: string;
  editingId: string | null;
  editTitle: string;
  isLoading: boolean;
  onEditTitleChange: (title: string) => void;
  onSaveEdit: () => Promise<void>;
  onCancelEdit: () => void;
  onTogglePin: (id: string, currentState: boolean) => Promise<void>;
  onStartEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}