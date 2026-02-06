import { createContext, useContext, useReducer, useMemo } from 'react';
import * as THREE from 'three';
import { BimData } from '@/loader';
import { ViewerState, ViewerActions, ViewerCamera } from '@/types/viewer';

const defaultCamera: ViewerCamera = {
  position: new THREE.Vector3(50, 50, 50),
  target: new THREE.Vector3(0, 0, 0),
  fov: 50
};

const initialState: ViewerState = {
  data: null,
  loading: false,
  error: null,
  progress: 0,
  camera: defaultCamera,
  filters: {
    categories: [],
    levels: [],
    visibleInstances: new Set()
  },
  selection: {
    selectedInstances: new Set(),
    hoveredInstance: null
  }
};

type Action =
  | { type: 'SET_DATA'; payload: BimData | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_CAMERA'; payload: Partial<ViewerCamera> }
  | { type: 'SET_FILTERS'; payload: Partial<ViewerState['filters']> }
  | { type: 'TOGGLE_CATEGORY'; payload: string }
  | { type: 'TOGGLE_LEVEL'; payload: string }
  | { type: 'SELECT_INSTANCE'; payload: { index: number; multi: boolean } }
  | { type: 'DESELECT_INSTANCE'; payload: number }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_HOVERED'; payload: number | null }
  | { type: 'RESET_CAMERA' }
  | { type: 'FIT_TO_VIEW' };

function viewerReducer(state: ViewerState, action: Action): ViewerState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_CAMERA':
      return { ...state, camera: { ...state.camera, ...action.payload } };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'TOGGLE_CATEGORY': {
      const cats = new Set(state.filters.categories);
      if (cats.has(action.payload)) {
        cats.delete(action.payload);
      } else {
        cats.add(action.payload);
      }
      return { ...state, filters: { ...state.filters, categories: Array.from(cats) } };
    }
    case 'TOGGLE_LEVEL': {
      const levels = new Set(state.filters.levels);
      if (levels.has(action.payload)) {
        levels.delete(action.payload);
      } else {
        levels.add(action.payload);
      }
      return { ...state, filters: { ...state.filters, levels: Array.from(levels) } };
    }
    case 'SELECT_INSTANCE': {
      const selected = new Set(action.payload.multi ? state.selection.selectedInstances : []);
      selected.add(action.payload.index);
      return { ...state, selection: { ...state.selection, selectedInstances: selected } };
    }
    case 'DESELECT_INSTANCE': {
      const selected = new Set(state.selection.selectedInstances);
      selected.delete(action.payload);
      return { ...state, selection: { ...state.selection, selectedInstances: selected } };
    }
    case 'CLEAR_SELECTION':
      return { ...state, selection: { ...state.selection, selectedInstances: new Set() } };
    case 'SET_HOVERED':
      return { ...state, selection: { ...state.selection, hoveredInstance: action.payload } };
    case 'RESET_CAMERA':
      return { ...state, camera: defaultCamera };
    case 'FIT_TO_VIEW':
      return state;
    default:
      return state;
  }
}

const ViewerContext = createContext<(ViewerState & ViewerActions) | null>(null);

export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(viewerReducer, initialState);

  const actions: ViewerActions = useMemo(() => ({
    setData: (data) => dispatch({ type: 'SET_DATA', payload: data }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    setProgress: (progress) => dispatch({ type: 'SET_PROGRESS', payload: progress }),
    setCamera: (camera) => dispatch({ type: 'SET_CAMERA', payload: camera }),
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    toggleCategory: (category) => dispatch({ type: 'TOGGLE_CATEGORY', payload: category }),
    toggleLevel: (level) => dispatch({ type: 'TOGGLE_LEVEL', payload: level }),
    selectInstance: (index, multi = false) => dispatch({ type: 'SELECT_INSTANCE', payload: { index, multi } }),
    deselectInstance: (index) => dispatch({ type: 'DESELECT_INSTANCE', payload: index }),
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
    setHoveredInstance: (index) => dispatch({ type: 'SET_HOVERED', payload: index }),
    resetCamera: () => dispatch({ type: 'RESET_CAMERA' }),
    fitToView: () => dispatch({ type: 'FIT_TO_VIEW' })
  }), []);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return (
    <ViewerContext.Provider value={value}>
      {children}
    </ViewerContext.Provider>
  );
}

export function useViewerContext() {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error('useViewerContext must be used within a ViewerProvider');
  }
  return context;
}
