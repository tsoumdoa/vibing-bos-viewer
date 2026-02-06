# Ara3D React WebGL Viewer - Implementation Plan

## Overview

Build a modern React-based 3D BIM viewer that leverages the existing Ara3D WebGL library's BOS file parsing capabilities while providing a React-friendly API using React Three Fiber (R3F).

### Key Goals
- Reuse existing BOS parsing logic from `ara3d-webgl` repository
- Provide idiomatic React hooks and components
- Support all existing features: BOS loading, filtering, selection, camera control
- Maintain TypeScript type safety throughout
- Support both ES modules and UMD builds

---

## Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Build Tool | Vite 7.3.1 | Fast development and optimized builds |
| Framework | React 19+ | UI component library |
| css | tailwindcss v4 | Styling library |
| 3D Rendering | React Three Fiber (@react-three/fiber) | React renderer for Three.js |
| 3D Helpers | @react-three/drei | Useful R3F abstractions |
| Core 3D | Three.js 0.182.0 | 3D graphics engine |
| BOS Parsing | hyparquet + jszip | Reused from ara3d-webgl |
| State Management | React Context + useState/useReducer | Local state management |
| Event Handling | ste-events/signals | Reused from ara3d-webgl |
| Type Safety | TypeScript 5.x | Type checking |
|Router|TanStackRouter|Routing library|

---

## Architecture

### Core Principles

1. **Reusable Parser**: Extract and reuse BOS parsing logic from `ara3d-webgl`
2. **React Integration**: Wrap Three.js viewer in React Three Fiber components
3. **Declarative API**: Provide React-friendly hooks (e.g., `useBosLoader`, `useViewer`)
4. **Composition**: Allow flexible UI composition around the 3D canvas

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │ ViewerProvider  │  │     Ara3DViewer (Canvas)     │ │
│  │  (Context API)  │  │                              │ │
│  └─────────────────┘  │  ┌────────────────────────┐  │ │
│                       │  │   ViewerScene          │  │ │
│  ┌─────────────────┐  │  │  (R3F Scene)           │  │ │
│  │  UI Components  │  │  │                        │  │ │
│  │  - Controls     │  │  │  ┌──────────────────┐  │  │ │
│  │  - Filters      │  │  │  │ BimGeometryGroup │  │  │ │
│  │  - Selection    │  │  │  │ (InstancedMesh)  │  │  │ │
│  │  - Toolbar      │  │  │  └──────────────────┘  │  │ │
│  └─────────────────┘  │  │                        │  │ │
│                       │  │  ┌──────────────────┐  │  │ │
│                       │  │  │ Environment      │  │  │ │
│                       │  │  │ (Lights/Ground)  │  │  │ │
│                       │  │  └──────────────────┘  │  │ │
│                       │  └────────────────────────┘  │ │
│                       └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Reused from ara3d-webgl               │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │              BOS Parsing Layer                      │ │
│  │  - BimOpenSchemaLoader                             │ │
│  │  - BimData / BimGeometry / BimResolver             │ │
│  │  - buildInstances / buildGeometryGroup             │ │
│  │  - BimQuery / Entity Management                    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
ara3d-react-webgl/
├── public/
│   └── models/                    # Sample BOS files for demos
│       └── sample.bos
├── src/
│   ├── components/                # React components
│   │   ├── Ara3DViewer.tsx        # Main viewer component (Canvas wrapper)
│   │   ├── ViewerScene.tsx        # R3F scene setup
│   │   ├── BimGeometryGroup.tsx   # InstancedMesh rendering component
│   │   ├── Environment.tsx        # Lights and ground plane
│   │   ├── CameraController.tsx   # Camera management with R3F
│   │   ├── SelectionController.tsx # Raycasting and selection
│   │   └── ui/                    # UI components
│   │       ├── ViewerControls.tsx
│   │       ├── FilterPanel.tsx
│   │       ├── SelectionPanel.tsx
│   │       └── Toolbar.tsx
│   ├── hooks/                     # Custom React hooks
│   │   ├── useBosLoader.ts        # Hook for loading BOS files
│   │   ├── useViewer.ts           # Hook for viewer state/actions
│   │   ├── useCamera.ts           # Hook for camera control
│   │   ├── useSelection.ts        # Hook for selection/picking
│   │   └── useFilters.ts          # Hook for category/level filtering
│   ├── context/                   # React Context
│   │   ├── ViewerProvider.tsx     # Main context provider
│   │   └── viewerContext.ts       # Context definition
│   ├── loader/                    # Reused from ara3d-webgl
│   │   ├── bimOpenSchemaLoader.ts # BOS loader
│   │   ├── bimData.ts             # Data container
│   │   ├── bimGeometry.ts         # Geometry interfaces
│   │   ├── bimEntities.ts         # Entity structures
│   │   ├── bimResolver.ts         # Data resolution
│   │   ├── bimQuery.ts            # Query helpers
│   │   ├── buildInstances.ts      # Instance building
│   │   └── buildGeometryGroup.ts  # Geometry optimization
│   ├── types/                     # TypeScript types
│   │   ├── index.ts               # Main exports
│   │   ├── viewer.ts              # Viewer types
│   │   └── bim.ts                 # BIM-specific types
│   ├── utils/                     # Utilities
│   │   ├── geometry.ts            # Geometry helpers
│   │   └── events.ts              # Event handling
│   ├── index.ts                   # Main library exports
│   └── App.tsx                    # Demo app (examples)
├── examples/                      # Standalone examples
│   ├── basic-viewer/
│   ├── filtered-viewer/
│   └── selection-demo/
├── docs/                          # Generated documentation
├── tests/                         # Unit tests
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript config
├── package.json
└── plan.md                        # This file
```

---

## Implementation Phases

### Phase 1: Setup and Core Dependencies (Week 1)

**Goals**: Initialize project, set up build system, copy BOS parsing code

**Tasks**:
1. Initialize Vite project with React + TypeScript template
2. Install dependencies:
   ```bash
   npm install three @react-three/fiber @react-three/drei
   npm install hyparquet hyparquet-compressors jszip
   npm install ste-events ste-signals ste-simple-events deepmerge
   npm install -D @types/three @types/react @types/react-dom
   ```
3. Copy loader modules from `ara3d-webgl/src/loader/`:
   - `bimOpenSchemaLoader.ts`
   - `bimData.ts`
   - `bimGeometry.ts`
   - `bimEntities.ts`
   - `bimResolver.ts`
   - `bimQuery.ts`
   - `buildInstances.ts`
   - `buildGeometryGroup.ts`
   - `BimParameterTable.ts`
   - `BimParameterDescriptors.ts`
4. Update imports in copied files to work with new structure
5. Set up Vite configuration for library build
6. Create basic TypeScript types

**Deliverable**: Project builds successfully with BOS parsing working

---

### Phase 2: React Three Fiber Integration (Week 1-2)

**Goals**: Create R3F components for rendering BOS geometry

**Tasks**:
1. Create `ViewerProvider` context to manage viewer state
2. Create `Ara3DViewer` component wrapping R3F Canvas
3. Create `BimGeometryGroup` component:
   - Accept `BimGeometry` data as prop
   - Convert to R3F `<instancedMesh>` elements
   - Handle material assignment
4. Create `Environment` component with lights and ground
5. Create `CameraController` with OrbitControls from drei
6. Implement basic viewer state management (loading, errors)

**API Design**:
```tsx
// Basic usage
<Ara3DViewer>
  <ViewerScene url="/models/building.bos" />
</Ara3DViewer>

// With controls
<ViewerProvider>
  <Ara3DViewer>
    <ViewerScene />
  </Ara3DViewer>
  <ViewerControls />
</ViewerProvider>
```

**Deliverable**: Can render a BOS file in React with orbit controls

---

### Phase 3: Custom Hooks and State Management (Week 2)

**Goals**: Provide React-friendly hooks for common operations

**Tasks**:
1. Create `useBosLoader(url)` hook:
   - Returns `{ data, loading, error }`
   - Automatically loads BOS file
2. Create `useViewer()` hook:
   - Access viewer context
   - Get/set camera position
   - Access loaded BIM data
3. Create `useSelection()` hook:
   - Raycasting for instance picking
   - Track selected instances
   - Provide selection events
4. Create `useFilters()` hook:
   - Category-based filtering
   - Level-based filtering
   - Visibility toggling

**API Design**:
```tsx
function MyViewer() {
  const { data, loading } = useBosLoader('/models/building.bos');
  const { selected, select } = useSelection();
  const { filters, setCategoryFilter } = useFilters();

  if (loading) return <Loader />;
  
  return (
    <Ara3DViewer>
      <ViewerScene data={data} filters={filters} />
      <SelectionController onSelect={select} />
    </Ara3DViewer>
  );
}
```

**Deliverable**: All hooks working with full TypeScript support

---

### Phase 4: UI Components (Week 3)

**Goals**: Build reusable UI components for common BIM operations

**Tasks**:
1. Create `ViewerControls` component:
   - Zoom in/out buttons
   - Reset camera button
   - View modes (perspective/orthographic)
2. Create `FilterPanel` component:
   - Category checklist
   - Level selector
   - Visibility toggles
3. Create `SelectionPanel` component:
   - Show selected instance info
   - Parameter display
   - Entity properties
4. Create `Toolbar` component with common actions
5. Create `Loader` component with progress indicator
6. Create `ErrorDisplay` component

**Deliverable**: Complete UI component library with examples

---

### Phase 5: Advanced Features (Week 3-4)

**Goals**: Implement advanced features from original viewer

**Tasks**:
1. Implement color override system:
   - Per-category colors
   - Per-level colors
   - Selection highlighting
2. Add measurement tools
3. Add section planes/clipping
4. Implement camera animation/transitioning
5. Add screenshot/export functionality
6. Optimize performance:
   - Frustum culling
   - LOD (Level of Detail)
   - Geometry instancing optimization

**Deliverable**: Feature parity with original ara3d-webgl viewer

---

### Phase 6: Examples and Documentation (Week 4)

**Goals**: Create comprehensive examples and documentation

**Tasks**:
1. Create example projects:
   - `examples/basic-viewer/`: Simple BOS viewer
   - `examples/filtered-viewer/`: With category filters
   - `examples/selection-demo/`: Selection and properties
   - `examples/custom-ui/`: Custom UI integration
2. Write API documentation
3. Create Storybook stories for components
4. Write migration guide from ara3d-webgl
5. Add TypeScript examples

**Deliverable**: Complete documentation and working examples

---

### Phase 7: Testing and Optimization (Week 5)

**Goals**: Ensure stability and performance

**Tasks**:
1. Set up testing framework (Vitest + React Testing Library)
2. Write unit tests for:
   - Hooks
   - Utility functions
   - BOS parsing
3. Write integration tests for components
4. Performance testing with large models
5. Browser compatibility testing
6. Accessibility audit

**Deliverable**: Test suite with >80% coverage

---

### Phase 8: Build and Distribution (Week 5)

**Goals**: Prepare for NPM publication

**Tasks**:
1. Set up dual build (ESM + UMD)
2. Generate TypeScript declarations
3. Create npm publishing workflow
4. Set up GitHub Actions CI/CD
5. Create README with installation instructions
6. Add LICENSE and CONTRIBUTING files
7. Publish to NPM

**Deliverable**: Published NPM package `@ara3d/ara3d-react-webgl`

---

## Key Technical Decisions

### 1. React Three Fiber vs Direct Three.js

**Decision**: Use React Three Fiber (R3F)

**Rationale**:
- Idiomatic React patterns (declarative, component-based)
- Built-in performance optimizations
- Better integration with React ecosystem
- Easier to maintain and extend
- Hot reloading support in development

**Trade-off**: Slight learning curve for developers familiar with imperative Three.js

### 2. State Management

**Decision**: React Context + Hooks (no Redux/Zustand)

**Rationale**:
- Viewer state is localized and doesn't need global app state
- Context provides sufficient prop drilling avoidance
- Simpler dependency tree
- Easier to bundle as library

### 3. BOS Parsing Strategy

**Decision**: Copy and adapt existing code rather than depend on ara3d-webgl

**Rationale**:
- Avoid circular dependencies
- Can optimize specifically for React use cases
- Full control over the parsing pipeline
- Can tree-shake unused code

**Implementation**: Copy loader files from `ara3d-webgl/src/loader/` and update imports

### 4. Camera Control

**Decision**: Use @react-three/drei OrbitControls with custom wrapper

**Rationale**:
- Drei provides well-tested orbit controls
- Easy to extend with custom behaviors
- Works seamlessly with R3F

### 5. Geometry Rendering

**Decision**: Convert BOS data to R3F `<instancedMesh>` components

**Rationale**:
- R3F handles Three.js object lifecycle automatically
- Declarative updates when data changes
- Better React integration

### 6. Selection/Picking

**Decision**: Use R3F's `useThree` hook with raycaster

**Rationale**:
- Native R3F approach
- Can leverage GPU picking for large models
- Integrates with React event system

---

## Component API Specifications

### Ara3DViewer

```tsx
interface Ara3DViewerProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  camera?: {
    position?: [number, number, number];
    target?: [number, number, number];
    fov?: number;
  };
  environment?: {
    background?: string | THREE.Color;
    ground?: boolean;
    lights?: boolean;
  };
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

function Ara3DViewer(props: Ara3DViewerProps): JSX.Element;
```

### ViewerScene

```tsx
interface ViewerSceneProps {
  data?: BimGeometry;
  url?: string;
  filters?: {
    categories?: string[];
    levels?: string[];
    visible?: boolean[];
  };
  colors?: {
    byCategory?: Record<string, THREE.Color>;
    byLevel?: Record<string, THREE.Color>;
    selection?: THREE.Color;
  };
  onProgress?: (progress: number) => void;
}

function ViewerScene(props: ViewerSceneProps): JSX.Element;
```

### useBosLoader Hook

```tsx
interface UseBosLoaderResult {
  data: BimGeometry | null;
  loading: boolean;
  error: Error | null;
  progress: number;
  reload: () => void;
}

function useBosLoader(url: string): UseBosLoaderResult;
```

### useSelection Hook

```tsx
interface UseSelectionResult {
  selected: number[]; // Instance indices
  select: (indices: number[]) => void;
  deselect: () => void;
  toggle: (index: number) => void;
  isSelected: (index: number) => boolean;
  selectedEntities: Entity[];
}

function useSelection(): UseSelectionResult;
```

### useFilters Hook

```tsx
interface UseFiltersResult {
  categories: string[];
  levels: string[];
  activeCategories: string[];
  activeLevels: string[];
  setCategoryFilter: (categories: string[]) => void;
  setLevelFilter: (levels: string[]) => void;
  toggleCategory: (category: string) => void;
  toggleLevel: (level: string) => void;
  resetFilters: () => void;
  visibleInstances: number[];
}

function useFilters(data: BimGeometry | null): UseFiltersResult;
```

---

## Package.json Structure

```json
{
  "name": "@ara3d/ara3d-react-webgl",
  "version": "1.0.0",
  "description": "React-based 3D BIM viewer built on Ara3D WebGL and React Three Fiber",
  "type": "module",
  "main": "./dist/ara3d-react-webgl.umd.cjs",
  "module": "./dist/ara3d-react-webgl.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/ara3d-react-webgl.js",
      "require": "./dist/ara3d-react-webgl.umd.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:lib": "vite build --mode lib",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "three": "^0.182.0"
  },
  "dependencies": {
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.120.0",
    "deepmerge": "^4.3.1",
    "hyparquet": "^1.23.0",
    "hyparquet-compressors": "^1.1.1",
    "jszip": "^3.10.1",
    "ste-events": "^3.0.7",
    "ste-signals": "^3.0.9",
    "ste-simple-events": "^3.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.182.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.182.0",
    "typescript": "^5.9.0",
    "vite": "^6.0.0",
    "vite-plugin-dts": "^4.0.0",
    "vitest": "^2.0.0"
  }
}
```

---

## Migration Guide from ara3d-webgl

### Before (ara3d-webgl):
```javascript
import * as ARA3D from '@ara3d/ara3d-webgl';

const viewer = new ARA3D.Viewer();
const loader = new ARA3D.BimOpenSchemaLoader();
const bimData = await loader.load('/path/to/model.bos');
viewer.add(bimData.ThreeGeometry);
```

### After (React version):
```tsx
import { Ara3DViewer, ViewerScene, useBosLoader } from '@ara3d/ara3d-react-webgl';

function App() {
  const { data, loading } = useBosLoader('/path/to/model.bos');
  
  return (
    <Ara3DViewer>
      {data && <ViewerScene data={data} />}
    </Ara3DViewer>
  );
}
```

---

## Performance Considerations

### Geometry Optimization
- Reuse existing `buildGeometryGroup.ts` logic for instancing
- Use R3F's `useMemo` for expensive geometry calculations
- Implement frustum culling via R3F's `<Bvh>` from drei

### State Updates
- Batch selection updates with `useCallback`
- Use `useMemo` for filtered instance lists
- Debounce filter changes

### Memory Management
- Properly dispose Three.js objects on unmount
- Use `useEffect` cleanup functions
- Implement geometry unloading when not visible

### Large Models
- Implement progressive loading
- Use web workers for BOS parsing
- Consider implementing LOD system

---

## Future Enhancements

1. **VR/AR Support**: Integrate with @react-three/xr
2. **Collaborative Features**: Multi-user viewing with WebRTC
3. **Annotations**: Add markup and measurement tools
4. **Animation**: Support for animated sequences
5. **GLTF Support**: Extend loader to handle GLTF/GLB
6. **Streaming**: Progressive loading for very large models
7. **Server-Side Rendering**: Next.js compatibility

---

## Resources

- **React Three Fiber Docs**: https://docs.pmnd.rs/react-three-fiber
- **Three.js Docs**: https://threejs.org/docs/
- **Original ara3d-webgl**: https://github.com/ara3d/ara3d-webgl
- **BOS Format Spec**: Documented in ara3d-webgl README

---

## Conclusion

This plan outlines a comprehensive approach to building a React-based 3D BIM viewer that leverages the robust BOS parsing capabilities of the existing ara3d-webgl library while providing a modern, React-friendly API. The phased approach allows for incremental development and testing, ensuring a stable and performant final product.

**Estimated Timeline**: 5 weeks
**Team Size**: 1-2 developers
**Key Dependencies**: React 18+, Three.js, React Three Fiber, existing ara3d-webgl loader code



## design skill
please refer to frontend-skill.md for your UI design. please also preare 5 UIs for your UI design, each of them should be different enough to be unique and put them /1, /2, /3, /4, /5.
