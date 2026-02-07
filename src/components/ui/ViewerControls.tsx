import { useViewer } from '@/hooks/useViewer';
import { useSelection } from '@/hooks/useSelection';
import { useViewerContext } from '@/context/ViewerProvider';

interface ViewerControlsProps {
  className?: string;
}

export function ViewerControls({ className = '' }: ViewerControlsProps) {
  const { resetCamera, fitToView } = useViewer();
  const { clear, selectedInstances } = useSelection();
  const { clayMode, toggleClayMode } = useViewerContext();

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
      <button
        onClick={toggleClayMode}
        className={`px-3 py-1.5 text-sm rounded transition-colors ${
          clayMode 
            ? 'bg-white text-gray-900 hover:bg-gray-200' 
            : 'bg-gray-800 text-white hover:bg-gray-700'
        }`}
      >
        {clayMode ? 'Colors' : 'Clay Mode'}
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
