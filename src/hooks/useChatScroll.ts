// src/hooks/useChatScroll.ts
import { useEffect, useRef } from 'react';

interface UseChatScrollOptions {
  // You can pass specific dependencies if needed, or simply let the consumer
  // pass the array they want to watch. For scrolling, it's typically the messages array.
  // We explicitly define it here to make it clear what we're expecting.
  dependency: any[];
}

/**
 * Custom hook to automatically scroll a chat-like container to the bottom
 * whenever its dependencies change (e.g., new messages are added).
 *
 * @param dependency The dependency array that, when changed, triggers the scroll.
 * Typically, this would be your messages array.
 * @returns A ref that should be attached to the scrollable container's last element or bottom.
 */
export function useChatScroll({ dependency }: UseChatScrollOptions) { // Destructure dependency
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dependency]); // <-- NOW THE CRITICAL CHANGE: Wrap 'dependency' in an array.
                    // This ensures the dependency array always has size 1.

  return ref;
}