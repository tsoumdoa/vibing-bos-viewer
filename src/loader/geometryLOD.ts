import * as THREE from 'three';

/**
 * LOD (Level of Detail) system for optimizing large BIM model rendering
 * 
 * This system creates simplified versions of geometry for distant objects,
 * reducing the number of vertices that need to be processed when objects
 * are far from the camera.
 */

export interface LODConfig {
    // Distance thresholds for LOD levels
    lodDistances: number[];
    // Geometry simplification ratios for each LOD level
    simplificationRatios: number[];
}

const DEFAULT_LOD_CONFIG: LODConfig = {
    lodDistances: [50, 150, 300],  // Switch LOD at these distances
    simplificationRatios: [1.0, 0.5, 0.25, 0.1]  // Full, Half, Quarter, Tenth detail
};

/**
 * Simplifies geometry by reducing vertex count
 * Uses a simple distance-based decimation algorithm
 */
export function simplifyGeometry(
    geometry: THREE.BufferGeometry,
    targetRatio: number
): THREE.BufferGeometry {
    if (targetRatio >= 1.0) {
        return geometry;
    }
    
    const positions = geometry.attributes.position.array as Float32Array;
    const indices = geometry.index?.array as Uint32Array | Uint16Array | null;
    
    if (!indices) {
        // Non-indexed geometry - just return as-is for now
        return geometry;
    }
    
    const vertexCount = positions.length / 3;
    const targetVertexCount = Math.max(3, Math.floor(vertexCount * targetRatio));
    
    if (targetVertexCount >= vertexCount) {
        return geometry;
    }
    
    // Simple decimation: keep every Nth triangle
    const skipFactor = Math.ceil(vertexCount / targetVertexCount);
    const newTriangleCount = Math.floor(indices.length / 3 / skipFactor);
    const newIndexCount = newTriangleCount * 3;
    
    const newIndices = new (indices.constructor as any)(newIndexCount);
    
    let newIdx = 0;
    for (let i = 0; i < indices.length; i += 3 * skipFactor) {
        if (newIdx + 3 > newIndexCount) break;
        
        newIndices[newIdx++] = indices[i];
        newIndices[newIdx++] = indices[i + 1];
        newIndices[newIdx++] = indices[i + 2];
    }
    
    const simplifiedGeom = new THREE.BufferGeometry();
    simplifiedGeom.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    simplifiedGeom.setIndex(new THREE.BufferAttribute(newIndices, 1));
    simplifiedGeom.computeBoundingBox();
    simplifiedGeom.computeBoundingSphere();
    
    return simplifiedGeom;
}

/**
 * Creates LOD levels for a given geometry
 */
export function createLODLevels(
    geometry: THREE.BufferGeometry,
    config: LODConfig = DEFAULT_LOD_CONFIG
): THREE.LOD {
    const lod = new THREE.LOD();
    
    // Add levels from highest to lowest detail
    for (let i = 0; i < config.simplificationRatios.length; i++) {
        const ratio = config.simplificationRatios[i];
        const distance = config.lodDistances[i - 1] || 0;
        
        const simplifiedGeom = simplifyGeometry(geometry, ratio);
        const material = new THREE.MeshBasicMaterial({
            color: 0x888888,
            wireframe: true  // Use wireframe for distant objects
        });
        
        const mesh = new THREE.Mesh(simplifiedGeom, material);
        lod.addLevel(mesh, distance);
    }
    
    return lod;
}

/**
 * Determines if a geometry is worth creating LOD levels for
 */
export function shouldCreateLOD(
    geometry: THREE.BufferGeometry,
    minVertexThreshold: number = 1000
): boolean {
    const vertexCount = geometry.attributes.position?.count || 0;
    return vertexCount > minVertexThreshold;
}

/**
 * Performance metrics tracker for LOD system
 */
export class LODPerformanceTracker {
    private activeLODLevels: Map<string, number> = new Map();
    private switchCounts: number[] = [0, 0, 0, 0];
    
    recordLODLevel(objectId: string, level: number): void {
        const currentLevel = this.activeLODLevels.get(objectId);
        if (currentLevel !== undefined && currentLevel !== level) {
            this.switchCounts[level]++;
        }
        this.activeLODLevels.set(objectId, level);
    }
    
    getStats(): string {
        const total = this.activeLODLevels.size;
        const level0 = Array.from(this.activeLODLevels.values()).filter(l => l === 0).length;
        const level1 = Array.from(this.activeLODLevels.values()).filter(l => l === 1).length;
        const level2 = Array.from(this.activeLODLevels.values()).filter(l => l === 2).length;
        const level3 = Array.from(this.activeLODLevels.values()).filter(l => l >= 3).length;
        
        return `LOD Distribution: Level0=${level0}(${((level0/total)*100).toFixed(1)}%), ` +
               `Level1=${level1}(${((level1/total)*100).toFixed(1)}%), ` +
               `Level2=${level2}(${((level2/total)*100).toFixed(1)}%), ` +
               `Level3+=${level3}(${((level3/total)*100).toFixed(1)}%)`;
    }
}

export const lodPerformance = new LODPerformanceTracker();