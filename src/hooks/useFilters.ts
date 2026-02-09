import { useCallback, useMemo } from 'react';
import { useViewerStore } from '@/stores/viewerStore';
import { BimData } from '@/loader';

export interface UseFiltersResult {
  categories: string[];
  levels: string[];
  activeCategories: string[];
  activeLevels: string[];
  visibleInstances: Set<number>;
  setCategoryFilter: (categories: string[]) => void;
  setLevelFilter: (levels: string[]) => void;
  toggleCategory: (category: string) => void;
  toggleLevel: (level: string) => void;
  resetFilters: () => void;
  isCategoryActive: (category: string) => boolean;
  isLevelActive: (level: string) => boolean;
}

export function useFilters(data: BimData | null): UseFiltersResult {
  const filters = useViewerStore((state) => state.filters);
  const setFilters = useViewerStore((state) => state.setFilters);
  const toggleCategory = useViewerStore((state) => state.toggleCategory);
  const toggleLevel = useViewerStore((state) => state.toggleLevel);

  const categories = useMemo(() => {
    if (!data?.Query) return [];
    const map = data.Query.CategoryToInstances();
    return Array.from(map.keys()).sort();
  }, [data]);

  const levels = useMemo(() => {
    if (!data?.Query) return [];
    const map = data.Query.LevelToInstances();
    return Array.from(map.keys()).filter(l => l).sort();
  }, [data]);

  const visibleInstances = useMemo(() => {
    if (!data?.Instances) return new Set<number>();
    
    const activeCats = new Set(filters.categories);
    const activeLevels = new Set(filters.levels);
    
    // If no filters active, show all
    if (activeCats.size === 0 && activeLevels.size === 0) {
      return new Set(data.Instances.map((_, i) => i).filter(i => data.Instances[i] !== undefined));
    }

    const visible = new Set<number>();
    
    for (let i = 0; i < data.Instances.length; i++) {
      const instance = data.Instances[i];
      if (!instance) continue;

      const category = data.Resolver.GetInstanceCategoryName(instance);
      const params = data.Resolver.GetInstanceParameters(instance);
      const levelParam = params?.find(p => p.Name === 'Rvt:Element:Level');
      const level = levelParam ? String(levelParam.Value) : '';

      // Instance is visible if it matches at least one active filter (when filters are present)
      const catMatch = activeCats.size === 0 || activeCats.has(category);
      const levelMatch = activeLevels.size === 0 || activeLevels.has(level);

      if (catMatch && levelMatch) {
        visible.add(i);
      }
    }

    return visible;
  }, [data, filters.categories, filters.levels]);

  const setCategoryFilter = useCallback((cats: string[]) => {
    setFilters({ categories: cats });
  }, [setFilters]);

  const setLevelFilter = useCallback((lvls: string[]) => {
    setFilters({ levels: lvls });
  }, [setFilters]);

  const resetFilters = useCallback(() => {
    setFilters({ categories: [], levels: [] });
  }, [setFilters]);

  const isCategoryActive = useCallback((cat: string) => {
    return filters.categories.includes(cat);
  }, [filters.categories]);

  const isLevelActive = useCallback((level: string) => {
    return filters.levels.includes(level);
  }, [filters.levels]);

  return {
    categories,
    levels,
    activeCategories: filters.categories,
    activeLevels: filters.levels,
    visibleInstances,
    setCategoryFilter,
    setLevelFilter,
    toggleCategory,
    toggleLevel,
    resetFilters,
    isCategoryActive,
    isLevelActive
  };
}
