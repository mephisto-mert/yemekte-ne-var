import { useEffect } from 'react';

/**
 * Attaches a window keydown listener to invoke onClose when the Escape key is pressed.
 */
export function useEscapeKey(onClose: () => void, active: boolean = true): void {
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, active]);
}
