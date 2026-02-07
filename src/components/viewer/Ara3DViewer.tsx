import React, { useRef, useMemo } from 'react';
import { Canvas, extend, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three/webgpu';
import { useViewerContext } from '@/context/ViewerProvider';
import { BimData } from '@/loader';
import { createRendererWithFallback } from '@/utils/renderer';

extend(THREE as any);

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

export function Ara3DViewer({
  children,
  className,
  style,
  camera = {},
  environment = { ground: true, lights: true },
  onLoad
}: Ara3DViewerProps) {
  // Use onLoad via effects if needed
  React.useEffect(() => {
    if (onLoad) onLoad();
  }, [onLoad]);

  const defaultCamera = {
    position: camera.position || [50, 50, 50] as [number, number, number],
    fov: camera.fov || 50
  };

  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        camera={defaultCamera}
        gl={async (props) => {
          return createRendererWithFallback({ antialias: true, alpha: true, ...props });
        }}
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

  // Update context camera when R3F camera changes
  React.useEffect(() => {
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

  React.useEffect(() => {
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

  // Clone the geometry group to avoid mutating the original
  const clonedGroup = useMemo(() => {
    const clone = geometry.clone();
    
    // Apply visibility filters
    if (filters?.visibleInstances && clone) {
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
          // Handle visibility based on pick metadata
          const pickData = child.userData.pick;
          if (pickData) {
            if (pickData.kind === 'instanced') {
              // For instanced meshes, we'll handle visibility at the instance level
              // This is a simplified approach - full implementation would need instance-level visibility
            } else if (pickData.kind === 'merged') {
              // For merged meshes, visibility is per-triangle, handled differently
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
        // Handle selection logic here
        const pickData = e.object.userData.pick;
        if (pickData) {
          if (pickData.kind === 'single') {
            context.selectInstance(pickData.instanceIndex, e.shiftKey);
          } else if (pickData.kind === 'instanced') {
            // Get instance index from intersection
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
