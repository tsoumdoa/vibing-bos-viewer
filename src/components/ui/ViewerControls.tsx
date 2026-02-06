import { useViewer } from '@/hooks/useViewer';
import { useSelection } from '@/hooks/useSelection';

interface ViewerControlsProps {
  className?: string;
}

export function ViewerControls({ className = '' }: ViewerControlsProps) {
  const { resetCamera, fitToView } = useViewer();
  const { clear, selectedInstances } = useSelection();

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={resetCamera}
        className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors"
      >
        Reset View
      </button>
      <button
        onClick={fitToView}
        className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors"
      >
        Fit to View
      </button>
      {selectedInstances.size > 0 && (
        <button
          onClick={clear}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors"
        >
          Clear Selection ({selectedInstances.size})
        </button>
      )}
    </div>
  );
}

export default ViewerControls;
