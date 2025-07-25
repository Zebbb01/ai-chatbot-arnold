// src/components/sidebar/DeleteConfirmationDialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  conversationId: string | null;
  isLoading: boolean;
  onConfirm: (conversationId: string) => void;
  onCancel: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  conversationId,
  isLoading,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = () => {
    if (conversationId) {
      onConfirm(conversationId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Conversation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this conversation? This action cannot be undone.
            All messages and related data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}