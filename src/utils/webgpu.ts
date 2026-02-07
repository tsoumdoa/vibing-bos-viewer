export const WebGPUCapabilities = {
  isSupported: (): boolean => !!navigator.gpu,

  getAdapterInfo: async (): Promise<GPUAdapterInfo | null> => {
    if (!navigator.gpu) return null;
    const adapter = await navigator.gpu.requestAdapter();
    return adapter?.info || null;
  },

  getRecommendedRenderer: (): 'webgpu' | 'webgl' => {
    return navigator.gpu ? 'webgpu' : 'webgl';
  },

  getLimits: async (): Promise<GPUSupportedLimits | null> => {
    if (!navigator.gpu) return null;
    const adapter = await navigator.gpu.requestAdapter();
    return adapter?.limits || null;
  },

  hasFeatures: async (...features: GPUFeatureName[]): Promise<boolean> => {
    if (!navigator.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return false;

    const supportedFeatures = adapter.features;
    return features.every(feature => supportedFeatures.has(feature));
  }
};
