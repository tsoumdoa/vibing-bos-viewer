import { useState, useEffect, useCallback } from 'react';
import { BimOpenSchemaLoader, BimData } from '@/loader';

export interface UseBosLoaderResult {
  data: BimData | null;
  loading: boolean;
  error: Error | null;
  progress: number;
  reload: () => void;
}

export function useBosLoader(url: string, loadParameters: boolean = false): UseBosLoaderResult {
  const [data, setData] = useState<BimData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      const loader = new BimOpenSchemaLoader();
      const result = await loader.load(url, { loadParameters });
      setData(result);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [url, loadParameters]);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback(() => {
    load();
  }, [load]);

  return { data, loading, error, progress, reload };
}
