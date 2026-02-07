import * as THREE from 'three/webgpu';
import * as THREE_WEBGL from 'three';

export async function createWebGPURenderer(props: any = {}): Promise<THREE.WebGPURenderer> {
  const renderer = new THREE.WebGPURenderer({
    antialias: props.antialias ?? true,
    alpha: props.alpha ?? true,
    ...props
  });
  await renderer.init();
  return renderer;
}

export function createWebGLRenderer(props: any = {}): THREE_WEBGL.WebGLRenderer {
  return new THREE_WEBGL.WebGLRenderer({
    antialias: props.antialias ?? true,
    alpha: props.alpha ?? true,
    ...props
  });
}

export function isWebGPUSupported(): boolean {
  return 'gpu' in navigator;
}

export async function createRendererWithFallback(props: any = {}): Promise<THREE_WEBGL.WebGLRenderer | THREE.WebGPURenderer> {
  if (isWebGPUSupported()) {
    try {
      console.log('Initializing WebGPU renderer...');
      const webGPURenderer = await createWebGPURenderer(props);
      console.log('WebGPU renderer initialized successfully');
      return webGPURenderer;
    } catch (error) {
      console.warn('WebGPU initialization failed, falling back to WebGL:', error);
    }
  } else {
    console.log('WebGPU not supported, using WebGL');
  }
  
  return createWebGLRenderer(props);
}
