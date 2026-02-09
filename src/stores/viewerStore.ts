import { create } from 'zustand';
import * as THREE from 'three';
import { BimData } from '@/loader';
import { ViewerCamera, ViewerFilters, ViewerSelection } from '@/types/viewer';

const defaultCamera: ViewerCamera = {
  position: new THREE.Vector3(50, 50, 50),
  target: new THREE.Vector3(0, 0, 0),
  fov: 50
};

interface ViewerStore {
  data: BimData | null;
  loading: boolean;
  error: Error | null;
  progress: number;
  camera: ViewerCamera;
  filters: ViewerFilters;
  selection: ViewerSelection;

  setData: (data: BimData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setProgress: (progress: number) => void;
  setCamera: (camera: Partial<ViewerCamera>) => void;
  setFilters: (filters: Partial<ViewerFilters>) => void;
  toggleCategory: (category: string) => void;
  toggleLevel: (level: string) => void;
  selectInstance: (instanceIndex: number, multi?: boolean) => void;
  deselectInstance: (instanceIndex: number) => void;
  clearSelection: () => void;
  setHoveredInstance: (instanceIndex: number | null) => void;
  resetCamera: () => void;
  fitToView: () => void;
  reset: () => void;
}

const initialState = {
  data: null as BimData | null,
  loading: false,
  error: null as Error | null,
  progress: 0,
  camera: defaultCamera,
  filters: {
    categories: [] as string[],
    levels: [] as string[],
    visibleInstances: new Set<number>()
  },
  selection: {
    selectedInstances: new Set<number>(),
    hoveredInstance: null as number | null
  }
};

export const useViewerStore = create<ViewerStore>((set) => ({
  ...initialState,

  setData: (data) => set({ data }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setProgress: (progress) => set({ progress }),

  setCamera: (cameraUpdate) => set((state) => ({
    camera: { ...state.camera, ...cameraUpdate }
  })),

  setFilters: (filtersUpdate) => set((state) => ({
    filters: { ...state.filters, ...filtersUpdate }
  })),

  toggleCategory: (category) => set((state) => {
    const cats = new Set(state.filters.categories);
    if (cats.has(category)) {
      cats.delete(category);
    } else {
      cats.add(category);
    }
    return {
      filters: { ...state.filters, categories: Array.from(cats) }
    };
  }),

  toggleLevel: (level) => set((state) => {
    const levels = new Set(state.filters.levels);
    if (levels.has(level)) {
      levels.delete(level);
    } else {
      levels.add(level);
    }
    return {
      filters: { ...state.filters, levels: Array.from(levels) }
    };
  }),

  selectInstance: (instanceIndex, multi = false) => set((state) => {
    const selected = new Set(multi ? state.selection.selectedInstances : []);
    selected.add(instanceIndex);
    return {
      selection: { ...state.selection, selectedInstances: selected }
    };
  }),

  deselectInstance: (instanceIndex) => set((state) => {
    const selected = new Set(state.selection.selectedInstances);
    selected.delete(instanceIndex);
    return {
      selection: { ...state.selection, selectedInstances: selected }
    };
  }),

  clearSelection: () => set((state) => ({
    selection: { ...state.selection, selectedInstances: new Set() }
  })),

  setHoveredInstance: (instanceIndex) => set((state) => ({
    selection: { ...state.selection, hoveredInstance: instanceIndex }
  })),

  resetCamera: () => set({ camera: defaultCamera }),

  fitToView: () => {
    // TODO: Implement fit to view logic
  },

  reset: () => set(initialState)
}));
