import * as THREE from 'three';

export const xrayVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vPosition = position;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const xrayFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPosition;

  uniform vec3 baseColor;
  uniform float opacity;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    float NdotV = max(dot(normal, viewDir), 0.0);
    float fresnel = pow(1.0 - NdotV, 2.0);
    
    vec3 edgeColor = vec3(0.3, 0.6, 1.0) * fresnel * 0.8;
    
    float heightBased = smoothstep(-50.0, 100.0, vPosition.y);
    vec3 heightColor = mix(vec3(0.4, 0.5, 0.6), vec3(0.6, 0.7, 0.8), heightBased);
    
    vec3 finalColor = baseColor * 0.5 + heightColor * 0.3 + edgeColor;
    float alpha = opacity + fresnel * 0.3;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const clayVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const clayFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  uniform vec3 baseColor;
  uniform vec3 lightDirection;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(lightDirection);
    vec3 viewDir = normalize(vViewPosition);
    
    float NdotL = max(dot(normal, lightDir), 0.0);
    float NdotV = max(dot(normal, viewDir), 0.0);
    
    float rim = 1.0 - NdotV;
    rim = pow(rim, 4.0) * 0.15;
    
    float ao = smoothstep(-0.5, 1.0, dot(normal, vec3(0.0, 1.0, 0.0)));
    ao = 0.7 + ao * 0.3;
    
    vec3 ambient = baseColor * 0.6 * ao;
    vec3 diffuse = baseColor * NdotL * 0.5 * ao;
    vec3 rimLight = vec3(1.0) * rim;
    
    vec3 finalColor = ambient + diffuse + rimLight;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const analyticalVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const analyticalFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  uniform vec3 baseColor;
  uniform vec3 lightDirection;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(lightDirection);
    
    float NdotL = max(dot(normal, lightDir), 0.0);
    float NdotUp = max(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0);
    
    vec3 color = baseColor;
    
    vec3 horizontal = vec3(0.95, 0.97, 1.0);
    vec3 vertical = vec3(0.85, 0.87, 0.90);
    color = mix(vertical, horizontal, NdotUp);
    
    color *= 0.7 + NdotL * 0.3;
    
    float heightTint = smoothstep(0.0, 50.0, vPosition.y);
    color = mix(color, color * 1.05, heightTint);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const heatmapVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const heatmapFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;

  uniform float minHeight;
  uniform float maxHeight;

  vec3 getColor(float t) {
    vec3 c1 = vec3(0.0, 0.3, 0.8);
    vec3 c2 = vec3(0.0, 0.8, 0.8);
    vec3 c3 = vec3(1.0, 1.0, 0.0);
    vec3 c4 = vec3(1.0, 0.5, 0.0);
    vec3 c5 = vec3(0.8, 0.0, 0.0);
    
    if (t < 0.25) return mix(c1, c2, t * 4.0);
    if (t < 0.5) return mix(c2, c3, (t - 0.25) * 4.0);
    if (t < 0.75) return mix(c3, c4, (t - 0.5) * 4.0);
    return mix(c4, c5, (t - 0.75) * 4.0);
  }

  void main() {
    float height = vPosition.y;
    float t = clamp((height - minHeight) / (maxHeight - minHeight), 0.0, 1.0);
    
    vec3 color = getColor(t);
    
    float NdotUp = max(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0);
    color *= 0.8 + NdotUp * 0.2;
    
    gl_FragColor = vec4(color, 0.9);
  }
`;

export function createXrayMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: color },
      opacity: { value: 0.25 }
    },
    vertexShader: xrayVertexShader,
    fragmentShader: xrayFragmentShader,
    transparent: true,
    depthWrite: false
  });
}

export function createClayMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Color(0xf8f8f8) },
      lightDirection: { value: new THREE.Vector3(0.5, 1.0, 0.5).normalize() }
    },
    vertexShader: clayVertexShader,
    fragmentShader: clayFragmentShader
  });
}

export function createAnalyticalMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Color(0xeeeeee) },
      lightDirection: { value: new THREE.Vector3(0.5, 1.0, 0.5).normalize() }
    },
    vertexShader: analyticalVertexShader,
    fragmentShader: analyticalFragmentShader
  });
}

export function createHeatmapMaterial(minHeight: number = 0, maxHeight: number = 50): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      minHeight: { value: minHeight },
      maxHeight: { value: maxHeight }
    },
    vertexShader: heatmapVertexShader,
    fragmentShader: heatmapFragmentShader,
    transparent: true
  });
}

export function applyRenderMode(
  mesh: THREE.Mesh,
  renderMode: 'standard' | 'clay' | 'xray' | 'analytical' | 'heatmap',
  originalMaterial?: THREE.Material | THREE.Material[],
  minHeight?: number,
  maxHeight?: number
): void {
  if (!mesh.material) return;

  switch (renderMode) {
    case 'standard':
      if (originalMaterial) {
        mesh.material = originalMaterial;
      }
      break;
    case 'clay':
      mesh.material = createClayMaterial();
      break;
    case 'xray':
      mesh.material = createXrayMaterial(new THREE.Color(0x405060));
      break;
    case 'analytical':
      mesh.material = createAnalyticalMaterial();
      break;
    case 'heatmap':
      mesh.material = createHeatmapMaterial(minHeight || 0, maxHeight || 50);
      break;
  }
}
