import { useCallback } from 'react';
import { useViewerContext } from '@/context/ViewerProvider';

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
  const context = useViewerContext();

  const select = useCallback((index: number, multi: boolean = false) => {
    context.selectInstance(index, multi);
  }, [context]);

  const deselect = useCallback((index: number) => {
    context.deselectInstance(index);
  }, [context]);

  const toggle = useCallback((index: number, multi: boolean = false) => {
    if (context.selection.selectedInstances.has(index)) {
      context.deselectInstance(index);
    } else {
      context.selectInstance(index, multi);
    }
  }, [context]);

  const clear = useCallback(() => {
    context.clearSelection();
  }, [context]);

  const isSelected = useCallback((index: number) => {
    return context.selection.selectedInstances.has(index);
  }, [context.selection.selectedInstances]);

  const setHovered = useCallback((index: number | null) => {
    context.setHoveredInstance(index);
  }, [context]);

  return {
    selectedInstances: context.selection.selectedInstances,
    hoveredInstance: context.selection.hoveredInstance,
    select,
    deselect,
    toggle,
    clear,
    isSelected,
    setHovered
  };
}
