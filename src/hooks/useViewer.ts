import { useMemo } from 'react';
import { useViewerStore } from '@/stores/viewerStore';
import { BimData, Instance } from '@/loader';

export function useViewer() {
  const data = useViewerStore((state) => state.data);
  const loading = useViewerStore((state) => state.loading);
  const error = useViewerStore((state) => state.error);
  const progress = useViewerStore((state) => state.progress);
  const camera = useViewerStore((state) => state.camera);
  const setCamera = useViewerStore((state) => state.setCamera);
  const resetCamera = useViewerStore((state) => state.resetCamera);
  const fitToView = useViewerStore((state) => state.fitToView);
  
  return {
    data,
    loading,
    error,
    progress,
    camera,
    setCamera,
    resetCamera,
    fitToView
  };
}

export function useBimData(): BimData | null {
  return useViewerStore((state) => state.data);
}

export function useInstances(): Array<Instance | undefined> {
  const data = useViewerStore((state) => state.data);
  return useMemo(() => data?.Instances ?? [], [data]);
}
