import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { useViewerContext } from '@/context/ViewerProvider';
import { BimData } from '@/loader';
import { isWebGPUSupported } from '@/renderer/webgpuRenderer';

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
  fallbackToWebGL?: boolean;
  forceWebGL?: boolean;
  useWebGPU?: boolean;
}

export function Ara3DViewer({
  children,
  className,
  style,
  camera = {},
  environment = { ground: true, lights: true },
  onLoad,
  onError,
  fallbackToWebGL = true,
  forceWebGL = false,
  useWebGPU: useWebGPUProp = true
}: Ara3DViewerProps) {
  const [error, setError] = useState<Error | null>(null);
  const [useWebGL, setUseWebGL] = useState(forceWebGL);

  useEffect(() => {
    if (forceWebGL) {
      setUseWebGL(true);
      return;
    }

    if (useWebGPUProp && !isWebGPUSupported()) {
      if (fallbackToWebGL) {
        console.warn('WebGPU not supported, falling back to WebGL');
        setUseWebGL(true);
      } else {
        const err = new Error('WebGPU not supported in this browser');
        setError(err);
        onError?.(err);
      }
    }
  }, [fallbackToWebGL, forceWebGL, useWebGPUProp, onError]);

  useEffect(() => {
    if (onLoad && !error) {
      onLoad();
    }
  }, [onLoad, error]);

  const defaultCamera = {
    position: camera.position || [50, 50, 50] as [number, number, number],
    fov: camera.fov || 50
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

  const shouldUseWebGPU = useWebGPUProp && !useWebGL && !forceWebGL;

  const glConfig = useMemo(() => {
    if (!shouldUseWebGPU) {
      return { antialias: true, alpha: true };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (props: any) => {
      const renderer = new WebGPURenderer({
        canvas: props.canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.setClearColor(environment.background as string || '#1a1a1a', 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Initialize WebGPU renderer
      renderer.init().catch((err: Error) => {
        console.error('WebGPU initialization failed:', err);
        if (fallbackToWebGL) {
          setUseWebGL(true);
        } else {
          setError(err);
          onError?.(err);
        }
      });

      return renderer;
    };
  }, [shouldUseWebGPU, environment.background, fallbackToWebGL, onError]);

  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        camera={defaultCamera}
        gl={glConfig}
        shadows
        style={{ background: environment.background as string || '#1a1a1a' }}
      >
        <SceneContent environment={environment}>
          {children}
        </SceneContent>
      </Canvas>
    </div>
  );
}

interface SceneContentProps {
  children?: React.ReactNode;
  environment: {
    ground?: boolean;
    lights?: boolean;
  };
}

function SceneContent({ children, environment }: SceneContentProps) {
  const { camera } = useThree();
  const context = useViewerContext();

  useEffect(() => {
    if (camera && context.setCamera) {
      context.setCamera({
        position: camera.position.clone()
      });
    }
  }, [camera, context]);

  return (
    <>
      {environment.lights && (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight
            position={[-10, 10, -10]}
            intensity={0.5}
          />
        </>
      )}
      
      {environment.ground && (
        <Grid
          position={[0, -0.01, 0]}
          args={[100, 100]}
          cellSize={5}
          cellThickness={0.5}
          cellColor="#444444"
          sectionSize={25}
          sectionThickness={1}
          sectionColor="#666666"
          fadeDistance={200}
          fadeStrength={1}
          infiniteGrid
        />
      )}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={1000}
      />

      {children}
    </>
  );
}

interface ViewerSceneProps {
  data?: BimData;
  url?: string;
  filters?: {
    categories?: string[];
    levels?: string[];
    visibleInstances?: Set<number>;
  };
  colors?: {
    byCategory?: Record<string, THREE.Color>;
    byLevel?: Record<string, THREE.Color>;
    selection?: THREE.Color;
  };
  onProgress?: (progress: number) => void;
}

export function ViewerScene({
  data,
  filters,
  colors
}: ViewerSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const context = useViewerContext();

  useEffect(() => {
    if (data && context.setData) {
      context.setData(data);
    }
  }, [data, context]);

  if (!data?.ThreeGeometry) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <BimGeometryGroup 
        geometry={data.ThreeGeometry}
        filters={filters}
        colors={colors}
      />
    </group>
  );
}

interface BimGeometryGroupProps {
  geometry: THREE.Group;
  filters?: {
    visibleInstances?: Set<number>;
  };
  colors?: {
    selection?: THREE.Color;
  };
}

function BimGeometryGroup({ geometry, filters }: BimGeometryGroupProps) {
  const context = useViewerContext();

  const clonedGroup = useMemo(() => {
    const clone = geometry.clone();
    
    if (filters?.visibleInstances && clone) {
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
          const pickData = child.userData.pick;
          if (pickData) {
            if (pickData.kind === 'instanced') {
            } else if (pickData.kind === 'merged') {
            } else if (pickData.kind === 'single') {
              const instanceIndex = pickData.instanceIndex;
              child.visible = filters.visibleInstances!.has(instanceIndex);
            }
          }
        }
      });
    }

    return clone;
  }, [geometry, filters?.visibleInstances]);

  return (
    <primitive 
      object={clonedGroup} 
      onPointerOver={(e: any) => {
        e.stopPropagation();
      }}
      onPointerOut={(e: any) => {
        e.stopPropagation();
      }}
      onClick={(e: any) => {
        e.stopPropagation();
        const pickData = e.object.userData.pick;
        if (pickData) {
          if (pickData.kind === 'single') {
            context.selectInstance(pickData.instanceIndex, e.shiftKey);
          } else if (pickData.kind === 'instanced') {
            const intersection = e.intersections[0];
            if (intersection && intersection.instanceId !== undefined) {
              const instanceIndex = pickData.instanceIndices[intersection.instanceId];
              context.selectInstance(instanceIndex, e.shiftKey);
            }
          }
        }
      }}
    />
  );
}

export default Ara3DViewer;