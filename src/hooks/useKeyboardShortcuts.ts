import { useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';

export interface UseKeyboardShortcutsOptions {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

/**
 * Custom hook that handles keyboard shortcuts for the workflow editor.
 * Currently supports Delete and Backspace keys for deleting selected nodes/edges.
 * Automatically ignores key events when the user is typing in an input field.
 *
 * @param options - Configuration object containing selected elements and delete callbacks
 */
export function useKeyboardShortcuts({
  selectedNode,
  selectedEdge,
  onDeleteNode,
  onDeleteEdge,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Safeguard against deleting if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((event.key === 'Delete' || event.key === 'Backspace') && !isTyping) {
        // Prevent default behavior (like navigating back) when deleting
        event.preventDefault();

        if (selectedNode) {
          onDeleteNode(selectedNode.id);
        } else if (selectedEdge) {
          onDeleteEdge(selectedEdge.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, onDeleteNode, onDeleteEdge]);
}
