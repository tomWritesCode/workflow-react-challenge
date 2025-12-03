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

function areWorkflowsEqual(
  nodes1: Node[],
  edges1: Edge[],
  nodes2: Node[],
  edges2: Edge[]
): boolean {
  if (nodes1.length !== nodes2.length || edges1.length !== edges2.length) {
    return false;
  }

  const serialize = (nodes: Node[], edges: Edge[]) =>
    JSON.stringify({
      nodes: nodes.map(({ id, type, position, data }) => ({
        id,
        type,
        position,
        data: Object.fromEntries(Object.entries(data).filter(([_, v]) => typeof v !== 'function')),
      })),
      edges: edges.map(({ id, source, target, sourceHandle, targetHandle, label }) => ({
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        label,
      })),
    });

  return serialize(nodes1, edges1) === serialize(nodes2, edges2);
}

export function useAutoSave({ nodes, edges, isValid }: UseAutoSaveParams): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  nodesRef.current = nodes;
  edgesRef.current = edges;

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!isValid) {
      setSaveStatus('error');
      return;
    }

    const existingSaved = loadSavedWorkflow();
    if (
      existingSaved &&
      areWorkflowsEqual(nodes, edges, existingSaved.nodes, existingSaved.edges)
    ) {
      setSaveStatus('saved');
      setLastSaved(new Date(existingSaved.timestamp));
      return;
    }

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const workflowData: SavedWorkflowData = {
          nodes: nodesRef.current,
          edges: edgesRef.current,
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
