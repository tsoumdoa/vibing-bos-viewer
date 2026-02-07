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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return renderer;
}

export function isWebGPUSupported(): boolean {
  return !!navigator.gpu;
}
