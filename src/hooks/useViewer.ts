import { useMemo } from 'react';
import { useViewerContext } from '@/context/ViewerProvider';
import { BimData, Instance } from '@/loader';

export function useViewer() {
  const context = useViewerContext();
  
  return {
    data: context.data,
    loading: context.loading,
    error: context.error,
    progress: context.progress,
    camera: context.camera,
    setCamera: context.setCamera,
    resetCamera: context.resetCamera,
    fitToView: context.fitToView
  };
}

export function useBimData(): BimData | null {
  const { data } = useViewerContext();
  return data;
}

export function useInstances(): Array<Instance | undefined> {
  const { data } = useViewerContext();
  return useMemo(() => data?.Instances ?? [], [data]);
}
