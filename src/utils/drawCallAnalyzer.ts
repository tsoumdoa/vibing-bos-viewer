import * as THREE from 'three';

/**
 * Draw Call Analyzer
 * 
 * Utilities for analyzing and optimizing draw calls in the scene.
 * Helps identify bottlenecks and measure optimization effectiveness.
 */

export interface DrawCallAnalysis {
    totalMeshes: number;
    totalDrawCalls: number;
    opaqueDrawCalls: number;
    transparentDrawCalls: number;
    instancedMeshes: number;
    batchedMeshes: number;
    mergedMeshes: number;
    singleMeshes: number;
    totalTriangles: number;
    totalVertices: number;
    materials: number;
    uniqueGeometries: number;
    recommendations: string[];
}

/**
 * Analyzes a Three.js scene and provides draw call statistics
 */
export function analyzeDrawCalls(scene: THREE.Object3D): DrawCallAnalysis {
    const analysis: DrawCallAnalysis = {
        totalMeshes: 0,
        totalDrawCalls: 0,
        opaqueDrawCalls: 0,
        transparentDrawCalls: 0,
        instancedMeshes: 0,
        batchedMeshes: 0,
        mergedMeshes: 0,
        singleMeshes: 0,
        totalTriangles: 0,
        totalVertices: 0,
        materials: 0,
        uniqueGeometries: 0,
        recommendations: []
    };

    const materials = new Set<THREE.Material>();
    const geometries = new Set<THREE.BufferGeometry>();

    scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh || object instanceof THREE.BatchedMesh) {
            analysis.totalMeshes++;
            analysis.totalDrawCalls++;

            const material = object.material as THREE.Material;
            materials.add(material);

            if (object instanceof THREE.InstancedMesh) {
                analysis.instancedMeshes++;
                const geom = object.geometry;
                geometries.add(geom);
                const triCount = (geom.index?.count || 0) / 3;
                analysis.totalTriangles += triCount * object.count;
                analysis.totalVertices += (geom.attributes.position?.count || 0) * object.count;
            } else if (object instanceof THREE.BatchedMesh) {
                analysis.batchedMeshes++;
                const geom = (object as any).geometry;
                if (geom) {
                    geometries.add(geom);
                    const count = (object as any).maxInstanceCount || 0;
                    const triCount = (geom.index?.count || 0) / 3;
                    analysis.totalTriangles += triCount * count;
                    analysis.totalVertices += (geom.attributes.position?.count || 0) * count;
                }
            } else {
                // Regular mesh
                const pickData = object.userData.pick;
                if (pickData?.kind === 'merged') {
                    analysis.mergedMeshes++;
                } else if (pickData?.kind === 'single') {
                    analysis.singleMeshes++;
                }

                const geom = object.geometry;
                geometries.add(geom);
                analysis.totalTriangles += (geom.index?.count || 0) / 3;
                analysis.totalVertices += geom.attributes.position?.count || 0;
            }

            // Check transparency
            const mat = object.material as THREE.MeshStandardMaterial;
            if (mat.transparent) {
                analysis.transparentDrawCalls++;
            } else {
                analysis.opaqueDrawCalls++;
            }
        }
    });

    analysis.materials = materials.size;
    analysis.uniqueGeometries = geometries.size;

    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis);

    return analysis;
}

function generateRecommendations(analysis: DrawCallAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.totalDrawCalls > 1000) {
        recommendations.push(`High draw call count (${analysis.totalDrawCalls}). Consider more aggressive geometry merging.`);
    }

    if (analysis.singleMeshes > analysis.totalMeshes * 0.1) {
        const percentage = ((analysis.singleMeshes / analysis.totalMeshes) * 100).toFixed(1);
        recommendations.push(`${percentage}% single meshes. Merge small instances to reduce draw calls.`);
    }

    if (analysis.materials > 100) {
        recommendations.push(`Many unique materials (${analysis.materials}). Consider material atlasing or reducing material variety.`);
    }

    if (analysis.transparentDrawCalls > analysis.totalDrawCalls * 0.3) {
        const percentage = ((analysis.transparentDrawCalls / analysis.totalDrawCalls) * 100).toFixed(1);
        recommendations.push(`${percentage}% transparent draw calls. Transparent objects require sorting and reduce performance.`);
    }

    if (analysis.instancedMeshes === 0 && analysis.batchedMeshes === 0) {
        recommendations.push('No instancing or batching detected. Use InstancedMesh or BatchedMesh for repeated geometry.');
    }

    if (analysis.uniqueGeometries > analysis.totalMeshes * 0.5) {
        recommendations.push('High geometry variety. Consider using shared geometries with instancing.');
    }

    return recommendations;
}

/**
 * Logs a formatted draw call analysis to the console
 */
export function logDrawCallAnalysis(analysis: DrawCallAnalysis): void {
    console.group('🔍 Draw Call Analysis');
    console.log(`Total Meshes: ${analysis.totalMeshes}`);
    console.log(`Total Draw Calls: ${analysis.totalDrawCalls}`);
    console.log(`  └─ Opaque: ${analysis.opaqueDrawCalls}`);
    console.log(`  └─ Transparent: ${analysis.transparentDrawCalls}`);
    console.log('');
    console.log(`Instanced Meshes: ${analysis.instancedMeshes}`);
    console.log(`Batched Meshes: ${analysis.batchedMeshes}`);
    console.log(`Merged Meshes: ${analysis.mergedMeshes}`);
    console.log(`Single Meshes: ${analysis.singleMeshes}`);
    console.log('');
    console.log(`Materials: ${analysis.materials}`);
    console.log(`Unique Geometries: ${analysis.uniqueGeometries}`);
    console.log(`Total Triangles: ${(analysis.totalTriangles / 1000000).toFixed(2)}M`);
    console.log(`Total Vertices: ${(analysis.totalVertices / 1000000).toFixed(2)}M`);
    
    if (analysis.recommendations.length > 0) {
        console.group('💡 Recommendations');
        analysis.recommendations.forEach(rec => console.log(`• ${rec}`));
        console.groupEnd();
    }
    
    console.groupEnd();
}

/**
 * Performance monitor for real-time draw call tracking
 */
export class DrawCallMonitor {
    private frameCount: number = 0;
    private drawCallHistory: number[] = [];
    private maxHistorySize: number = 60; // Keep last 60 frames

    recordFrame(drawCalls: number): void {
        this.frameCount++;
        this.drawCallHistory.push(drawCalls);
        
        if (this.drawCallHistory.length > this.maxHistorySize) {
            this.drawCallHistory.shift();
        }
    }

    getAverageDrawCalls(): number {
        if (this.drawCallHistory.length === 0) return 0;
        const sum = this.drawCallHistory.reduce((a, b) => a + b, 0);
        return sum / this.drawCallHistory.length;
    }

    getPeakDrawCalls(): number {
        return Math.max(...this.drawCallHistory, 0);
    }

    reset(): void {
        this.frameCount = 0;
        this.drawCallHistory = [];
    }

    getReport(): string {
        const avg = this.getAverageDrawCalls().toFixed(0);
        const peak = this.getPeakDrawCalls();
        return `Draw Calls - Avg: ${avg}, Peak: ${peak}, Frames: ${this.frameCount}`;
    }
}

export const drawCallMonitor = new DrawCallMonitor();