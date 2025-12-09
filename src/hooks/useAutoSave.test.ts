import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSavedWorkflow } from './useAutoSave';
import type { SavedWorkflowData } from './useAutoSave';

describe('useAutoSave - Core behavior', () => {
  const AUTOSAVE_KEY = 'workflow-autosave';

  const mockStorage: Storage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] || null,
      get length() {
        return Object.keys(store).length;
      },
    };
  })();

  beforeEach(() => {
    mockStorage.clear();
    global.localStorage = mockStorage;
  });

  it('CRITICAL: should reject invalid data (missing required fields)', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Missing nodes
    localStorage.setItem(
      AUTOSAVE_KEY,
      JSON.stringify({ edges: [], timestamp: '2024-01-01T00:00:00.000Z' })
    );
    expect(loadSavedWorkflow()).toBeNull();

    // Missing edges
    localStorage.setItem(
      AUTOSAVE_KEY,
      JSON.stringify({ nodes: [], timestamp: '2024-01-01T00:00:00.000Z' })
    );
    expect(loadSavedWorkflow()).toBeNull();

    // Missing timestamp
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ nodes: [], edges: [] }));
    expect(loadSavedWorkflow()).toBeNull();

    consoleWarnSpy.mockRestore();
  });

  it('should successfully load valid workflow data', () => {
    const validWorkflow: SavedWorkflowData = {
      nodes: [
        { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
        { id: '2', type: 'end', position: { x: 100, y: 100 }, data: { label: 'End' } },
      ],
      edges: [{ id: 'e1', source: '1', target: '2' }],
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(validWorkflow));

    const result = loadSavedWorkflow();
    expect(result).not.toBeNull();
    expect(result?.nodes).toHaveLength(2);
    expect(result?.edges).toHaveLength(1);
    expect(result?.timestamp).toBeDefined();
  });

  it('should handle corrupted JSON gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem(AUTOSAVE_KEY, 'invalid json{{{');

    const result = loadSavedWorkflow();
    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return null when no saved workflow exists', () => {
    const result = loadSavedWorkflow();
    expect(result).toBeNull();
  });
});
