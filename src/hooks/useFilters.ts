import { useCallback, useMemo } from 'react';
import { useViewerContext } from '@/context/ViewerProvider';
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
  const context = useViewerContext();

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
    
    const activeCats = new Set(context.filters.categories);
    const activeLevels = new Set(context.filters.levels);
    
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

      const catMatch = activeCats.size === 0 || activeCats.has(category);
      const levelMatch = activeLevels.size === 0 || activeLevels.has(level);

      if (catMatch && levelMatch) {
        visible.add(i);
      }
    }

    return visible;
  }, [data, context.filters.categories, context.filters.levels]);

  const setCategoryFilter = useCallback((cats: string[]) => {
    context.setFilters({ categories: cats });
  }, [context]);

  const setLevelFilter = useCallback((lvls: string[]) => {
    context.setFilters({ levels: lvls });
  }, [context]);

  const toggleCategory = useCallback((cat: string) => {
    context.toggleCategory(cat);
  }, [context]);

  const toggleLevel = useCallback((level: string) => {
    context.toggleLevel(level);
  }, [context]);

  const resetFilters = useCallback(() => {
    context.setFilters({ categories: [], levels: [] });
  }, [context]);

  const isCategoryActive = useCallback((cat: string) => {
    return context.filters.categories.includes(cat);
  }, [context.filters.categories]);

  const isLevelActive = useCallback((level: string) => {
    return context.filters.levels.includes(level);
  }, [context.filters.levels]);

  return {
    categories,
    levels,
    activeCategories: context.filters.categories,
    activeLevels: context.filters.levels,
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
