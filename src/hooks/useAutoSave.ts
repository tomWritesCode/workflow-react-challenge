import { useEffect, useState, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * ISO 8601 date string format (e.g., "2024-12-02T20:30:45.123Z")
 * Normalising the date string to be comparable to a DB timestamp
 */
export type ISODateString = string;

export interface SavedWorkflowData {
  nodes: Node[];
  edges: Edge[];
  timestamp: ISODateString;
}

export interface UseAutoSaveParams {
  nodes: Node[];
  edges: Edge[];
  isValid: boolean;
}

export interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  clearSaved: () => void;
}

const AUTOSAVE_KEY = 'workflow-autosave';
const DEBOUNCE_DELAY = 2000;

export function useAutoSave({ nodes, edges, isValid }: UseAutoSaveParams): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!isValid) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const workflowData: SavedWorkflowData = {
          nodes,
          edges,
          timestamp: new Date().toISOString(),
        };

        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(workflowData));
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save workflow to localStorage:', error);
        setSaveStatus('error');
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, isValid]);

  /**
   * Clears the saved workflow from localStorage
   */
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      setLastSaved(null);
      setSaveStatus('idle');
    } catch (error) {
      console.error('Failed to clear saved workflow from localStorage:', error);
    }
  }, []);

  return {
    saveStatus,
    lastSaved,
    clearSaved,
  };
}

export function loadSavedWorkflow(): SavedWorkflowData | null {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) {
      return null;
    }

    const data = JSON.parse(saved) as SavedWorkflowData;

    if (!data.nodes || !data.edges || !data.timestamp) {
      console.warn('Invalid saved workflow data structure');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load saved workflow from localStorage:', error);
    return null;
  }
}
