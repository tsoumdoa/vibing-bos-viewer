import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Ara3DViewer, ViewerScene } from '@/components/viewer/Ara3DViewer';
import { ViewerProvider } from '@/context/ViewerProvider';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { useFilters } from '@/hooks/useFilters';
import { useSelection } from '@/hooks/useSelection';
import { BimData } from '@/loader';

export const Route = createFileRoute('/1')({
  component: CommandCenterViewer,
});

function CommandCenterViewer() {
  const [data, setData] = useState<BimData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  return (
    <ViewerProvider>
      <div className="h-screen bg-neutral-950 flex flex-col font-mono text-neutral-100 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="w-8 h-8 flex items-center justify-center rounded border border-neutral-700 hover:border-orange-500 hover:text-orange-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="font-bold tracking-wider text-sm">CMD-CTR-01</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-xs text-neutral-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>SYSTEM ONLINE</span>
            </div>
            <div className="px-2 py-1 bg-neutral-800 rounded text-neutral-400">
              v2.4.1
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col">
            <div className="p-4 border-b border-neutral-800">
              <h2 className="text-xs font-bold tracking-wider text-neutral-500 mb-3">
                DATA IMPORT
              </h2>
              <FileDropZone
                onFileLoaded={setData}
                onLoadingChange={setIsLoading}
                onError={setError}
                variant="industrial"
              />
            </div>
            
            {data && <ModelStats data={data} />}
          </aside>

          {/* Viewer Area */}
          <main className="flex-1 relative bg-neutral-950">
            {!data && !isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto border-2 border-neutral-800 rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-sm">NO DATA LOADED</p>
                    <p className="text-neutral-600 text-xs mt-1">Import a .BOS file to begin</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 z-50">
                <div className="bg-neutral-900 border border-red-500/50 rounded-lg p-6 max-w-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-red-400">IMPORT FAILED</h3>
                  </div>
                  <p className="text-sm text-neutral-400 mb-4">{error.message}</p>
                  <button 
                    onClick={() => setError(null)}
                    className="w-full py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            )}

            {data && (
              <Ara3DViewer
                className="w-full h-full"
                camera={{ position: [50, 50, 50], fov: 50 }}
                environment={{ ground: true, lights: true, background: '#0a0a0a' }}
              >
                <ViewerScene data={data} />
              </Ara3DViewer>
            )}
          </main>
        </div>

        {/* Status Bar */}
        <footer className="h-8 bg-neutral-900 border-t border-neutral-800 flex items-center px-4 text-[10px] text-neutral-500">
          <span className="text-orange-500 font-bold mr-4">{isLoading ? 'PROCESSING...' : 'READY'}</span>
          <span className="text-neutral-700">|</span>
          <span className="mx-4">{data ? `ENTITIES: ${data.Resolver.EntityCount}` : 'NO DATA'}</span>
          <span className="text-neutral-700">|</span>
          <span className="mx-4">{data ? `INSTANCES: ${data.Resolver.InstanceCount}` : '--'}</span>
          <div className="flex-1" />
          <span>ARA3D COMMAND CENTER</span>
        </footer>
      </div>
    </ViewerProvider>
  );
}

function ModelStats({ data }: { data: BimData }) {
  const { categories, levels, activeCategories, activeLevels, toggleCategory, toggleLevel } = useFilters(data);
  const { selectedInstances, clear } = useSelection();

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-neutral-800/50 border border-neutral-700 rounded p-3">
          <div className="text-[10px] text-neutral-500 mb-1">ENTITIES</div>
          <div className="text-xl font-bold text-orange-500">{data.Resolver.EntityCount}</div>
        </div>
        <div className="bg-neutral-800/50 border border-neutral-700 rounded p-3">
          <div className="text-[10px] text-neutral-500 mb-1">INSTANCES</div>
          <div className="text-xl font-bold text-orange-500">{data.Resolver.InstanceCount}</div>
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold tracking-wider text-neutral-500 mb-2">
            CATEGORIES ({activeCategories.length}/{categories.length})
          </h3>
          <div className="space-y-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`
                  w-full text-left px-3 py-2 rounded text-xs
                  transition-colors border
                  ${activeCategories.includes(cat)
                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                    : 'bg-neutral-800/30 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }
                `}
              >
                <span className="truncate block">{cat.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {levels.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold tracking-wider text-neutral-500 mb-2">
            LEVELS
          </h3>
          <div className="space-y-1">
            {levels.map(level => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`
                  w-full text-left px-3 py-2 rounded text-xs
                  transition-colors border
                  ${activeLevels.includes(level)
                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                    : 'bg-neutral-800/30 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }
                `}
              >
                <span className="truncate block">{level}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedInstances.size > 0 && (
        <div className="pt-4 border-t border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold tracking-wider text-neutral-500">
              SELECTION
            </h3>
            <button 
              onClick={clear}
              className="text-[10px] text-orange-500 hover:text-orange-400"
            >
              CLEAR
            </button>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3">
            <div className="text-2xl font-bold text-orange-500">{selectedInstances.size}</div>
            <div className="text-[10px] text-orange-400/70">ITEMS SELECTED</div>
          </div>
        </div>
      )}
    </div>
  );
}
