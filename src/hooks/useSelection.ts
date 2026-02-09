import { useCallback } from 'react';
import { useViewerStore } from '@/stores/viewerStore';

export interface UseSelectionResult {
  selectedInstances: Set<number>;
  hoveredInstance: number | null;
  select: (index: number, multi?: boolean) => void;
  deselect: (index: number) => void;
  toggle: (index: number, multi?: boolean) => void;
  clear: () => void;
  isSelected: (index: number) => boolean;
  setHovered: (index: number | null) => void;
}

export function useSelection(): UseSelectionResult {
  const selection = useViewerStore((state) => state.selection);
  const selectInstance = useViewerStore((state) => state.selectInstance);
  const deselectInstance = useViewerStore((state) => state.deselectInstance);
  const clearSelection = useViewerStore((state) => state.clearSelection);
  const setHoveredInstance = useViewerStore((state) => state.setHoveredInstance);

  const select = useCallback((index: number, multi: boolean = false) => {
    selectInstance(index, multi);
  }, [selectInstance]);

  const deselect = useCallback((index: number) => {
    deselectInstance(index);
  }, [deselectInstance]);

  const toggle = useCallback((index: number, multi: boolean = false) => {
    if (selection.selectedInstances.has(index)) {
      deselectInstance(index);
    } else {
      selectInstance(index, multi);
    }
  }, [selection.selectedInstances, deselectInstance, selectInstance]);

  const clear = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const isSelected = useCallback((index: number) => {
    return selection.selectedInstances.has(index);
  }, [selection.selectedInstances]);

  const setHovered = useCallback((index: number | null) => {
    setHoveredInstance(index);
  }, [setHoveredInstance]);

  return {
    selectedInstances: selection.selectedInstances,
    hoveredInstance: selection.hoveredInstance,
    select,
    deselect,
    toggle,
    clear,
    isSelected,
    setHovered
  };
}
