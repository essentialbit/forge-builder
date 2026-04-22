/**
 * Zustand middleware: in-memory undo/redo history for the builder.
 * Captures project+sections snapshots; ignores transient state like
 * isDragging, preview scale, or active tab.
 */
import type { StateCreator, StoreApi } from 'zustand';
import type { Project } from '@/types/builder';

const MAX_HISTORY = 50;

export interface HistorySlice {
  _past: Project[];
  _future: Project[];
  _capture: (next: Project) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

type MinimalStore = {
  project: Project | null;
};

export function createHistorySlice<T extends MinimalStore>(
  set: Parameters<StateCreator<T & HistorySlice>>[0],
  get: Parameters<StateCreator<T & HistorySlice>>[1],
): HistorySlice {
  return {
    _past: [],
    _future: [],
    _capture: (prev: Project) => {
      const past = get()._past;
      set({
        _past: [...past.slice(-MAX_HISTORY + 1), prev],
        _future: [],
      } as Partial<T & HistorySlice>);
    },
    undo: () => {
      const state = get();
      const past = state._past;
      if (past.length === 0 || !state.project) return;
      const prev = past[past.length - 1];
      set({
        project: prev,
        _past: past.slice(0, -1),
        _future: [state.project, ...state._future].slice(0, MAX_HISTORY),
      } as Partial<T & HistorySlice>);
    },
    redo: () => {
      const state = get();
      const future = state._future;
      if (future.length === 0 || !state.project) return;
      const next = future[0];
      set({
        project: next,
        _future: future.slice(1),
        _past: [...state._past, state.project].slice(-MAX_HISTORY),
      } as Partial<T & HistorySlice>);
    },
    canUndo: () => get()._past.length > 0,
    canRedo: () => get()._future.length > 0,
    clearHistory: () => set({ _past: [], _future: [] } as Partial<T & HistorySlice>),
  };
}

/** Deep clone for snapshot purposes (structured clone is fine for our JSON-ish state) */
export function cloneProject(p: Project): Project {
  return typeof structuredClone === 'function' ? structuredClone(p) : JSON.parse(JSON.stringify(p));
}
