import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Ara3DViewer, ViewerScene } from '@/components/viewer/Ara3DViewer';
import { ViewerProvider } from '@/context/ViewerProvider';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { useFilters } from '@/hooks/useFilters';
import { useSelection } from '@/hooks/useSelection';
import { BimData } from '@/loader';

export const Route = createFileRoute('/6')({
  component: BlueprintProViewer,
});

function BlueprintProViewer() {
  const [data, setData] = useState<BimData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<'model' | 'sections' | 'schedules'>('model');

  return (
    <ViewerProvider>
      <div className="h-screen bg-slate-950 flex flex-col font-mono text-slate-200 overflow-hidden selection:bg-cyan-500/30">
        {/* Blueprint Grid Background */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        </div>

        {/* Header */}
        <header className="relative h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-0 shrink-0 z-20">
          {/* Left: Logo & Project */}
          <div className="flex items-center h-full">
            <Link 
              to="/" 
              className="h-full w-14 flex items-center justify-center border-r border-slate-700 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            
            <div className="flex items-center gap-3 px-4 h-full border-r border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Project</span>
                <span className="text-xs font-semibold text-cyan-400">Untitled-001</span>
              </div>
            </div>

            <div className="flex items-center h-full">
              {['model', 'sections', 'schedules'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`
                    h-full px-6 text-xs uppercase tracking-wider border-r border-slate-700 transition-all
                    ${activeTab === tab 
                      ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-b-cyan-400' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Status & Tools */}
          <div className="flex items-center h-full">
            <div className="flex items-center gap-4 px-4 h-full border-r border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-4 h-full">
              <button className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div className="px-4 h-full flex items-center border-l border-slate-700 bg-slate-800/30">
              <span className="text-[10px] text-slate-500">v3.2.1</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* Left Sidebar - Properties */}
          <aside className="w-80 bg-slate-900/95 backdrop-blur border-r border-slate-700 flex flex-col">
            {/* File Import Section */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">File Import</h2>
                <span className="text-[10px] text-cyan-500/60">.BOS .ZIP</span>
              </div>
              <FileDropZone
                onFileLoaded={setData}
                onLoadingChange={setIsLoading}
                onError={setError}
                variant="industrial"
                className="border-slate-600 hover:border-cyan-500/50 bg-slate-800/30"
              />
            </div>
            
            {data ? <BlueprintStats data={data} /> : <EmptyState />}
          </aside>

          {/* Center - 3D Viewport */}
          <main className="flex-1 relative bg-slate-950">
            {/* Viewport Info Overlay */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded text-[10px] text-slate-400">
                <span className="text-slate-500">VIEW:</span> 3D Perspective
              </div>
              <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded text-[10px] text-slate-400">
                <span className="text-slate-500">SCALE:</span> 1:100
              </div>
            </div>

            {/* Coordinate Indicator */}
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded">
                <div className="text-[10px] text-slate-500 mb-1">COORDINATES</div>
                <div className="text-xs font-mono text-cyan-400">
                  X: <span className="text-slate-300">0.00</span> | 
                  Y: <span className="text-slate-300">0.00</span> | 
                  Z: <span className="text-slate-300">0.00</span>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {!data && !isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-6">
                  {/* Technical Drawing Icon */}
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full text-slate-700" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
                      <rect x="10" y="10" width="80" height="80" />
                      <line x1="10" y1="30" x2="90" y2="30" strokeDasharray="2 2" />
                      <line x1="10" y1="50" x2="90" y2="50" strokeDasharray="2 2" />
                      <line x1="10" y1="70" x2="90" y2="70" strokeDasharray="2 2" />
                      <line x1="30" y1="10" x2="30" y2="90" strokeDasharray="2 2" />
                      <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="2 2" />
                      <line x1="70" y1="10" x2="70" y2="90" strokeDasharray="2 2" />
                      <circle cx="50" cy="50" r="20" />
                      <rect x="35" y="35" width="30" height="30" transform="rotate(45 50 50)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-600 flex items-center justify-center">
                        <svg className="w-8 h-8 text-cyan-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">No Model Loaded</p>
                    <p className="text-slate-600 text-xs">Import a BIM model to begin analysis</p>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-cyan-500" />
                      Import .BOS
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-cyan-500" />
                      View Geometry
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-cyan-500" />
                      Analyze Data
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-50">
                <div className="bg-slate-900 border border-red-500/30 rounded-lg p-6 max-w-md shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-red-400">Import Error</h3>
                      <p className="text-[10px] text-slate-500">Failed to load model data</p>
                    </div>
                  </div>
                  <div className="bg-slate-950 rounded p-3 mb-4 border border-slate-800">
                    <p className="text-xs text-slate-400 font-mono">{error.message}</p>
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs uppercase tracking-wider transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* 3D Viewer */}
            {data && (
              <Ara3DViewer
                className="w-full h-full"
                camera={{ position: [50, 50, 50], fov: 50 }}
                environment={{ ground: true, lights: true, background: '#020617' }}
              >
                <ViewerScene data={data} />
              </Ara3DViewer>
            )}
          </main>

          {/* Right Sidebar - Quick Tools */}
          <aside className="w-16 bg-slate-900 border-l border-slate-700 flex flex-col items-center py-4 gap-2">
            {[
              { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Select' },
              { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Zoom' },
              { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: 'Reset' },
              { icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z', label: 'Filter' },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Measure' },
            ].map((tool, i) => (
              <button
                key={i}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors group relative"
                title={tool.label}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tool.icon} />
                </svg>
                <span className="absolute right-full mr-2 px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {tool.label}
                </span>
              </button>
            ))}
          </aside>
        </div>

        {/* Footer Status Bar */}
        <footer className="h-7 bg-slate-900 border-t border-slate-700 flex items-center px-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-6">
            <span className={isLoading ? 'text-cyan-400 animate-pulse' : 'text-emerald-500'}>
              {isLoading ? '● PROCESSING' : '● READY'}
            </span>
            
            <span className="text-slate-600">|</span>
            
            <span>
              ENTITIES: <span className="text-slate-300">{data?.Resolver.EntityCount ?? '—'}</span>
            </span>
            
            <span className="text-slate-600">|</span>
            
            <span>
              INSTANCES: <span className="text-slate-300">{data?.Resolver.InstanceCount ?? '—'}</span>
            </span>
            
            <span className="text-slate-600">|</span>
            
            <span>
              UNITS: <span className="text-slate-300">METRIC</span>
            </span>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <span>BLUEPRINT PRO v1.0</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-500/60">ARA3D</span>
          </div>
        </footer>
      </div>
    </ViewerProvider>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 p-4 space-y-4">
      <div className="space-y-2 opacity-50">
        <div className="h-2 bg-slate-800 rounded w-3/4" />
        <div className="h-2 bg-slate-800 rounded w-1/2" />
        <div className="h-2 bg-slate-800 rounded w-2/3" />
      </div>
      
      <div className="border border-slate-800 rounded p-3">
        <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Properties</div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Type</span>
            <span className="text-slate-500">—</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Material</span>
            <span className="text-slate-500">—</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Level</span>
            <span className="text-slate-500">—</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlueprintStats({ data }: { data: BimData }) {
  const { categories, levels, activeCategories, activeLevels, toggleCategory, toggleLevel } = useFilters(data);
  const { selectedInstances, clear } = useSelection();
  const [expandedSection, setExpandedSection] = useState<string | null>('categories');

  return (
    <div className="flex-1 overflow-auto">
      {/* Project Info */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/30">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 rounded border border-slate-700 p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Entities</div>
            <div className="text-xl font-bold text-cyan-400">{data.Resolver.EntityCount}</div>
          </div>
          <div className="bg-slate-950 rounded border border-slate-700 p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Instances</div>
            <div className="text-xl font-bold text-cyan-400">{data.Resolver.InstanceCount}</div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="border-b border-slate-700">
          <button 
            onClick={() => setExpandedSection(expandedSection === 'categories' ? null : 'categories')}
            className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors"
          >
            <span>CATEGORIES ({activeCategories.length}/{categories.length})</span>
            <svg 
              className={`w-4 h-4 transition-transform ${expandedSection === 'categories' ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSection === 'categories' && (
            <div className="px-3 pb-3 space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition-all
                    ${activeCategories.includes(cat)
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800/30 text-slate-400 border border-transparent hover:border-slate-600'
                    }
                  `}
                >
                  <span className={`
                    w-3 h-3 rounded-sm border flex items-center justify-center text-[8px]
                    ${activeCategories.includes(cat) 
                      ? 'bg-cyan-500 border-cyan-500 text-slate-900' 
                      : 'border-slate-600'
                    }
                  `}>
                    {activeCategories.includes(cat) && '✓'}
                  </span>
                  <span className="truncate uppercase">{cat}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Levels Section */}
      {levels.length > 0 && (
        <div className="border-b border-slate-700">
          <button 
            onClick={() => setExpandedSection(expandedSection === 'levels' ? null : 'levels')}
            className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors"
          >
            <span>LEVELS ({activeLevels.length}/{levels.length})</span>
            <svg 
              className={`w-4 h-4 transition-transform ${expandedSection === 'levels' ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSection === 'levels' && (
            <div className="px-3 pb-3 space-y-1">
              {levels.map((level, i) => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition-all
                    ${activeLevels.includes(level)
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800/30 text-slate-400 border border-transparent hover:border-slate-600'
                    }
                  `}
                >
                  <span className="text-[10px] text-slate-600 w-6">{String(i + 1).padStart(2, '0')}</span>
                  <span className="truncate">{level}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selection Info */}
      {selectedInstances.size > 0 && (
        <div className="p-4 border-t border-slate-700 mt-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selection</h3>
            <button 
              onClick={clear}
              className="text-[10px] text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              CLEAR
            </button>
          </div>
          <div className="bg-slate-950 rounded border border-cyan-500/20 p-3">
            <div className="text-2xl font-bold text-cyan-400">{selectedInstances.size}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Items Selected</div>
          </div>
        </div>
      )}
    </div>
  );
}
