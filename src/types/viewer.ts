import * as THREE from 'three';
import { BimData } from '@/loader';

export interface ViewerCamera {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

export interface ViewerFilters {
  categories: string[];
  levels: string[];
  visibleInstances: Set<number>;
}

export interface ViewerSelection {
  selectedInstances: Set<number>;
  hoveredInstance: number | null;
}

export interface ViewerState {
  data: BimData | null;
  loading: boolean;
  error: Error | null;
  progress: number;
  camera: ViewerCamera;
  filters: ViewerFilters;
  selection: ViewerSelection;
  clayMode: boolean;
}

export interface ViewerActions {
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
  toggleClayMode: () => void;
}

export type ViewerContextValue = ViewerState & ViewerActions;
