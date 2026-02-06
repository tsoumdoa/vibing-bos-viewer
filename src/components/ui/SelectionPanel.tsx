import { useSelection } from '@/hooks/useSelection';
import { useBimData } from '@/hooks/useViewer';

interface SelectionPanelProps {
  className?: string;
}

export function SelectionPanel({ className = '' }: SelectionPanelProps) {
  const data = useBimData();
  const { selectedInstances, clear } = useSelection();

  if (!data || selectedInstances.size === 0) return null;

  const selectedItems = Array.from(selectedInstances).map(idx => {
    const instance = data.Instances[idx];
    if (!instance) return null;
    return {
      index: idx,
      name: data.Resolver.GetInstanceName(instance),
      category: data.Resolver.GetInstanceCategoryName(instance),
      type: data.Resolver.GetInstanceTypeName(instance),
      globalId: data.Resolver.GetInstanceGlobalId(instance)
    };
  }).filter(Boolean);

  return (
    <div className={`bg-gray-900 text-white p-4 rounded-lg max-w-sm max-h-96 overflow-auto ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">
          Selection ({selectedInstances.size})
        </h3>
        <button
          onClick={clear}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2">
        {selectedItems.map((item: any) => (
          <div key={item.index} className="bg-gray-800 p-3 rounded text-sm">
            <div className="font-medium text-white">{item.name}</div>
            <div className="text-gray-400 text-xs mt-1">
              <div>Category: {item.category}</div>
              <div>Type: {item.type}</div>
              <div className="truncate">ID: {item.globalId}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectionPanel;
