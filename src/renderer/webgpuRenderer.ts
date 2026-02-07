import * as THREE from 'three';

import { WebGPURenderer } from 'three/webgpu';

export async function createWebGPURenderer(canvas: HTMLCanvasElement): Promise<WebGPURenderer> {
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported in this browser');
  }


  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

  await renderer.init();

  // Cap pixel ratio at 1.5 for better performance (matching WebGL configuration)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return renderer;
}

export function isWebGPUSupported(): boolean {
  return !!navigator.gpu;
}
