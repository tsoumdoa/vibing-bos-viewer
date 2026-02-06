# WebGPU Migration Plan for Ara3D React WebGL

## Executive Summary

This document outlines the migration path from WebGL to WebGPU for the Ara3D React WebGL viewer. WebGPU offers significant performance improvements for large BIM models through better instanced mesh rendering, compute shaders, and memory management.

---

## Current State

- **Three.js Version**: 0.182.0 (January 2024)
- **Renderer**: WebGLRenderer via React Three Fiber
- **Architecture**: React Three Fiber (R3F) + Three.js + Custom BOS Loader

---

## Migration Timeline

### Phase 1: Dependencies & Setup (1-2 days)

#### 1.1 Upgrade Three.js to Latest

**Current**: `three@^0.182.0`  
**Target**: `three@^0.170.0` or latest stable

```bash
# Check latest version
npm info three version

# Upgrade
npm install three@latest
npm install @types/three@latest --save-dev
```

**Breaking Changes to Address**:
- Material property changes (roughness/metalness defaults)
- Geometry attribute handling
- InstancedMesh API changes
- BufferGeometry attribute naming

#### 1.2 Upgrade React Three Fiber

**Current**: `@react-three/fiber@^9.0.0`  
**Target**: Latest compatible with Three.js r170+

```bash
npm install @react-three/fiber@latest
npm install @react-three/drei@latest
```

#### 1.3 Add WebGPU Dependencies

```bash
npm install three/webgpu
# or if using CDN/bundler approach:
npm install three@npm:three@latest
```

#### 1.4 Browser Compatibility Check

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  // ... existing config
  optimizeDeps: {
    exclude: ['three']
  },
  build: {
    target: 'esnext', // WebGPU requires modern browsers
  }
})
```

---

### Phase 2: Renderer Migration (2-3 days)

#### 2.1 Create WebGPU Renderer Factory

Create `src/renderer/webgpuRenderer.ts`:

```typescript
import * as THREE from 'three/webgpu';
import { WebGPURenderer } from 'three/webgpu';

export async function createWebGPURenderer(canvas: HTMLCanvasElement): Promise<WebGPURenderer> {
  // Check WebGPU support
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported in this browser');
  }

  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

  await renderer.init();
  
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return renderer;
}

export function isWebGPUSupported(): boolean {
  return !!navigator.gpu;
}
```

#### 2.2 Update Ara3DViewer Component

Modify `src/components/viewer/Ara3DViewer.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { createWebGPURenderer, isWebGPUSupported } from '@/renderer/webgpuRenderer';

// ... existing imports

export function Ara3DViewer({
  children,
  className,
  style,
  camera = {},
  environment = { ground: true, lights: true },
  onLoad,
  fallbackToWebGL = true, // Allow fallback
}: Ara3DViewerProps & { fallbackToWebGL?: boolean }) {
  const [renderer, setRenderer] = useState<THREE.WebGPURenderer | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [useWebGL, setUseWebGL] = useState(false);

  useEffect(() => {
    if (!isWebGPUSupported()) {
      if (fallbackToWebGL) {
        console.warn('WebGPU not supported, falling back to WebGL');
        setUseWebGL(true);
      } else {
        setError(new Error('WebGPU not supported in this browser'));
      }
    }
  }, [fallbackToWebGL]);

  const handleCanvasRef = async (canvas: HTMLCanvasElement | null) => {
    if (!canvas || useWebGL || renderer) return;
    
    try {
      const webgpuRenderer = await createWebGPURenderer(canvas);
      setRenderer(webgpuRenderer);
    } catch (err) {
      console.error('Failed to create WebGPU renderer:', err);
      if (fallbackToWebGL) {
        setUseWebGL(true);
      } else {
        setError(err as Error);
      }
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-900 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-2">Renderer Error</p>
          <p className="text-sm text-neutral-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      {useWebGL ? (
        // Fallback WebGL Canvas
        <Canvas
          camera={defaultCamera}
          gl={{ antialias: true, alpha: true }}
          shadows
          style={{ background: environment.background as string || '#1a1a1a' }}
        >
          <SceneContent environment={environment}>
            {children}
          </SceneContent>
        </Canvas>
      ) : (
        // WebGPU Canvas
        <canvas
          ref={handleCanvasRef}
          style={{ 
            width: '100%', 
            height: '100%',
            background: environment.background as string || '#1a1a1a'
          }}
        />
      )}
    </div>
  );
}
```

#### 2.3 Alternative: Use R3F's Experimental WebGPU Support

If R3F has WebGPU support by the time of migration:

```typescript
import { Canvas } from '@react-three/fiber';
import { WebGPURenderer } from 'three/webgpu';

<Canvas
  camera={defaultCamera}
  gl={(canvas) => {
    const renderer = new WebGPURenderer({ canvas });
    renderer.init();
    return renderer;
  }}
>
  {/* ... */}
</Canvas>
```

---

### Phase 3: Shader & Material Updates (3-4 days)

#### 3.1 Standard Materials

WebGPU uses WGSL instead of GLSL. Most Three.js materials should work, but custom shaders need migration.

**Standard materials that should work**:
- `MeshStandardMaterial` ✓
- `MeshBasicMaterial` ✓
- `MeshPhongMaterial` ✓
- `MeshLambertMaterial` ✓

**Test in**: `src/loader/buildInstances.ts`

#### 3.2 Custom Shaders (If Any)

If you have custom shaders in the BOS loader, convert GLSL to WGSL:

**Before (GLSL)**:
```glsl
// vertex shader
attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**After (WGSL)**:
```wgsl
// vertex shader
@vertex
fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
  return projectionMatrix * modelViewMatrix * vec4<f32>(position, 1.0);
}
```

**Action Items**:
1. Audit `src/loader/` for custom shaders
2. Check `buildGeometryGroup.ts` for material customizations
3. Test all material properties (roughness, metalness, etc.)

#### 3.3 InstancedMesh Optimization

WebGPU has better instanced mesh support. Update `src/loader/buildGeometryGroup.ts`:

```typescript
// Potential optimization with WebGPU compute shaders
export function createInstancedMeshes(instanceGroups: GroupedInstances): Array<THREE.InstancedMesh> {
  const r = new Array<THREE.InstancedMesh>();
  
  for (const [material, meshGroups] of instanceGroups) {
    for (const [geometry, instances] of meshGroups) {
      const count = instances.length;
      if (count <= 1) continue;

      const instanced = new THREE.InstancedMesh(geometry, material, count);
      
      // WebGPU can handle larger instance counts better
      // Consider using compute shaders for matrix updates if animated
      instanced.instanceMatrix.setUsage(THREE.StaticDrawUsage);

      const instanceIndices = new Uint32Array(count);
      for (let i = 0; i < count; i++) {
        instanced.setMatrixAt(i, instances[i].transform);
        instanceIndices[i] = instances[i].instance;
      }

      instanced.frustumCulled = true; // WebGPU handles this better
      instanced.matrixAutoUpdate = false;
      instanced.userData.pick = {
        kind: 'instanced',
        instanceIndices: instanceIndices
      };
      
      r.push(instanced);
    }
  }
  return r;
}
```

---

### Phase 4: Compute Shaders for BIM Operations (4-5 days)

#### 4.1 Implement GPU-Based Filtering

Create `src/compute/filters.ts`:

```typescript
import { wgsl } from 'three/webgpu';

// Compute shader for category filtering
const filterInstancesShader = wgsl`
  @compute @workgroup_size(64)
  fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let instanceIndex = global_id.x;
    
    if (instanceIndex >= arrayLength(&instances)) {
      return;
    }
    
    let instance = instances[instanceIndex];
    let categoryId = instance.categoryId;
    
    // Check if category is active
    var visible = false;
    for (var i = 0u; i < arrayLength(&activeCategories); i++) {
      if (activeCategories[i] == categoryId) {
        visible = true;
        break;
      }
    }
    
    visibility[instanceIndex] = visible;
  }
`;

export async function computeInstanceVisibility(
  instances: Uint32Array,
  activeCategories: Uint32Array
): Promise<Uint8Array> {
  // Implementation using WebGPU compute pipeline
  // This would run on GPU instead of CPU
}
```

#### 4.2 Benefits for BIM

- **Category Filtering**: Filter thousands of instances in parallel
- **Level Visibility**: GPU-accelerated level-based visibility
- **Selection Queries**: Fast spatial queries using compute shaders
- **LOD Generation**: Dynamic level-of-detail on GPU

---

### Phase 5: Testing & Validation (3-4 days)

#### 5.1 Browser Testing Matrix

| Browser | WebGPU Support | Fallback | Notes |
|---------|----------------|----------|-------|
| Chrome 113+ | ✓ Native | WebGL | Best support |
| Firefox Nightly | ✓ | WebGL | Enable flag |
| Safari 17.4+ | ✓ | WebGL | Limited support |
| Edge 113+ | ✓ | WebGL | Same as Chrome |

#### 5.2 Performance Benchmarks

Test with different model sizes:

```typescript
// Performance test script
const testModels = [
  { name: 'Small', instances: 1000 },
  { name: 'Medium', instances: 10000 },
  { name: 'Large', instances: 100000 },
  { name: 'XL', instances: 500000 },
];

// Metrics to measure:
// 1. Load time
// 2. Initial render time
// 3. Frame rate (FPS)
// 4. Memory usage
// 5. Filter operation speed
```

#### 5.3 Visual Regression Testing

- Compare WebGL vs WebGPU renders
- Check material appearances
- Verify shadows and lighting
- Test transparency and blending

---

### Phase 6: Progressive Enhancement (2-3 days)

#### 6.1 Feature Detection

```typescript
// src/utils/webgpu.ts
export const WebGPUCapabilities = {
  isSupported: () => !!navigator.gpu,
  
  getAdapterInfo: async () => {
    if (!navigator.gpu) return null;
    const adapter = await navigator.gpu.requestAdapter();
    return adapter?.info;
  },
  
  getRecommendedRenderer: () => {
    return navigator.gpu ? 'webgpu' : 'webgl';
  }
};
```

#### 6.2 User Preference

Add toggle in UI:

```typescript
// Allow users to force WebGL if WebGPU has issues
const [forceWebGL, setForceWebGL] = useLocalStorage('force-webgl', false);

<Ara3DViewer
  fallbackToWebGL={true}
  forceWebGL={forceWebGL}
/>
```

---

## Risk Assessment

### High Risk
1. **Browser Support**: Limited to Chrome/Edge stable
2. **Breaking Changes**: Three.js API changes between versions
3. **Performance Regression**: WebGPU might be slower for some operations initially

### Medium Risk
1. **Material Compatibility**: Custom shaders need rewriting
2. **Memory Usage**: Different memory management patterns
3. **Mobile Support**: Very limited on mobile devices

### Low Risk
1. **File Loading**: BOS loader unaffected (CPU-side)
2. **React Integration**: R3F abstracts most differences
3. **UI Components**: No changes needed to UI

---

## Implementation Checklist

### Week 1: Setup & Basic Migration
- [ ] Upgrade Three.js to r170+
- [ ] Upgrade R3F and Drei
- [ ] Create WebGPU renderer factory
- [ ] Update Ara3DViewer component
- [ ] Add fallback mechanism
- [ ] Test basic rendering

### Week 2: Material & Shader Updates
- [ ] Audit all materials
- [ ] Test instanced mesh rendering
- [ ] Verify shadows work
- [ ] Check lighting setups
- [ ] Performance baseline tests

### Week 3: Compute Shaders & Optimization
- [ ] Implement GPU filtering (optional v2)
- [ ] Optimize instance rendering
- [ ] Memory profiling
- [ ] Cross-browser testing

### Week 4: Testing & Deployment
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Documentation updates
- [ ] Production deployment

---

## Code Changes Summary

### Files to Modify:
1. `package.json` - Dependency versions
2. `vite.config.ts` - Build target
3. `src/components/viewer/Ara3DViewer.tsx` - Main renderer
4. `src/loader/buildInstances.ts` - Optimization
5. `src/loader/buildGeometryGroup.ts` - Material updates

### Files to Create:
1. `src/renderer/webgpuRenderer.ts` - WebGPU setup
2. `src/utils/webgpu.ts` - Feature detection
3. `src/compute/filters.ts` - GPU compute (v2)

---

## Expected Performance Improvements

### Large Models (100k+ instances):
- **WebGL**: ~15-20 FPS
- **WebGPU**: ~45-60 FPS
- **Improvement**: 3x faster

### Filtering Operations:
- **WebGL (CPU)**: 200-500ms
- **WebGPU (GPU)**: 10-20ms
- **Improvement**: 25x faster

### Memory Usage:
- More predictable memory management
- Better garbage collection
- Lower CPU overhead

---

## Fallback Strategy

Always maintain WebGL fallback:

```typescript
// Detection logic
if (!WebGPUCapabilities.isSupported()) {
  console.info('WebGPU not available, using WebGL fallback');
  return <WebGLViewer {...props} />;
}

// Error handling
try {
  return <WebGPUViewer {...props} />;
} catch (err) {
  console.error('WebGPU initialization failed:', err);
  return <WebGLViewer {...props} />;
}
```

---

## Success Metrics

1. **Zero visual regressions** - Renders look identical
2. **30%+ FPS improvement** on large models
3. **Successful fallback** - Works in all browsers
4. **Memory reduction** - Lower RAM usage
5. **Filter performance** - Sub-50ms filtering

---

## References

- [Three.js WebGPU Examples](https://threejs.org/examples/?q=webgpu)
- [WebGPU Fundamentals](https://webgpufundamentals.org/)
- [React Three Fiber Roadmap](https://github.com/pmndrs/react-three-fiber/issues/2501)
- [Three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)

---

## Estimated Effort

- **Total Time**: 3-4 weeks
- **Developer Resources**: 1 senior frontend + 1 3D graphics specialist
- **Risk Level**: Medium-High
- **Priority**: High (performance critical for large models)

---

*Plan created for Ara3D React WebGL*  
*Date: 2024*  
*Version: 1.0*
