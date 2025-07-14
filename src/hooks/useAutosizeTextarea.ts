// src/hooks/useAutosizeTextarea.ts
import { useEffect, useRef } from 'react';

// Defines the properties for the textarea element
interface UseAutosizeTextareaProps {
  value: string;
  maxHeight?: number; // Optional maximum height in pixels
}

/**
 * Custom hook to make a textarea automatically resize its height based on its content,
 * up to an optional maximum height.
 *
 * @param value The current value of the textarea.
 * @param maxHeight An optional maximum height for the textarea in pixels.
 * @returns A ref to be attached to the textarea element.
 */
export function useAutosizeTextarea({ value, maxHeight }: UseAutosizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Temporarily set height to 'auto' to correctly calculate scrollHeight
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;

      if (maxHeight && scrollHeight > maxHeight) {
        // If content exceeds max height, set to max height and allow scroll
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        // Otherwise, set height to scrollHeight and hide scrollbar
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [value, maxHeight]); // Re-run effect when value or maxHeight changes

  return textareaRef;
}