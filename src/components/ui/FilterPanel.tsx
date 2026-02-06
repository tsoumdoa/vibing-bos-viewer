import { useFilters } from '@/hooks/useFilters';
import { useBimData } from '@/hooks/useViewer';

interface FilterPanelProps {
  className?: string;
}

export function FilterPanel({ className = '' }: FilterPanelProps) {
  const data = useBimData();
  const { 
    categories, 
    levels, 
    activeCategories, 
    activeLevels, 
    toggleCategory, 
    toggleLevel,
    resetFilters 
  } = useFilters(data);

  if (!data) return null;

  return (
    <div className={`bg-gray-900 text-white p-4 rounded-lg max-w-xs ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Reset
        </button>
      </div>

      {categories.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Categories</h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {categories.map(cat => (
              <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-800 p-1 rounded">
                <input
                  type="checkbox"
                  checked={activeCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="w-4 h-4 rounded border-gray-600"
                />
                <span className="truncate">{cat}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {levels.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Levels</h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {levels.map(level => (
              <label key={level} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-800 p-1 rounded">
                <input
                  type="checkbox"
                  checked={activeLevels.includes(level)}
                  onChange={() => toggleLevel(level)}
                  className="w-4 h-4 rounded border-gray-600"
                />
                <span className="truncate">{level}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
