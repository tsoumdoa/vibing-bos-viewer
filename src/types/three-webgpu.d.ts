import * as THREE from 'three/webgpu';
import type { ThreeToJSXElements } from '@react-three/fiber';

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

export { THREE, TSL };
