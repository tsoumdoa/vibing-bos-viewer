import * as THREE from 'three';
import { Instance } from './buildInstances';

// Configuration for draw call optimization
const OPTIMIZATION_CONFIG = {
    // Maximum vertices per merged mesh (to avoid GPU memory issues)
    MAX_MERGED_VERTICES: 500000,
    // Maximum instances per BatchedMesh - WebGPU can handle much larger batches than WebGL
    MAX_BATCHED_INSTANCES: 50000,
    // Threshold for using InstancedMesh vs merged geometry
    INSTANCE_THRESHOLD: 2,
    // Whether to use BatchedMesh (WebGPU optimized)
    USE_BATCHED_MESH: true,
};

type GroupedInstances = Map<THREE.Material, Map<THREE.BufferGeometry, Instance[]>>;

export interface DrawCallStats {
    instancedMeshes: number;
    batchedMeshes: number;
    mergedMeshes: number;
    singleMeshes: number;
    totalDrawCalls: number;
    totalTriangles: number;
    totalVertices: number;
}

export function buildGeometry(instances: Array<Instance | undefined>): THREE.Group {
    console.time('Building geometry');
    const root = new THREE.Group();

    // Filter out undefined instances
    const validInstances = instances.filter((i): i is Instance => i !== undefined);
    
    // Group instances by material and geometry
    const instanceGroups = groupInstances(validInstances);
    
    // Separate opaque and transparent for proper rendering order
    const { opaque, transparent } = separateByTransparency(instanceGroups);
    
    // Create optimized meshes for opaque instances
    const opaqueMeshes = createOptimizedMeshes(opaque, false);
    opaqueMeshes.forEach(mesh => root.add(mesh));
    
    // Create optimized meshes for transparent instances
    const transparentMeshes = createOptimizedMeshes(transparent, true);
    transparentMeshes.forEach(mesh => root.add(mesh));

    // Calculate and log stats
    const stats = calculateStats(root, instanceGroups);
    logDrawCallStats(stats);

    // Convert Z-Up to Y-Up (for BOS geometry)
    root.rotation.x = -Math.PI / 2;

    console.timeEnd('Building geometry');
    return root;
}

function separateByTransparency(groups: GroupedInstances): { opaque: GroupedInstances; transparent: GroupedInstances } {
    const opaque: GroupedInstances = new Map();
    const transparent: GroupedInstances = new Map();

    for (const [material, meshGroups] of groups) {
        const isTransparent = (material as THREE.MeshStandardMaterial).transparent;
        const target = isTransparent ? transparent : opaque;
        target.set(material, meshGroups);
    }

    return { opaque, transparent };
}

function createOptimizedMeshes(groups: GroupedInstances, isTransparent: boolean): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    
    // Collect all instances that can be instanced
    const instancedCandidates: Array<{ material: THREE.Material; geometry: THREE.BufferGeometry; instances: Instance[] }> = [];
    const singleInstances: Instance[] = [];
    
    for (const [material, meshGroups] of groups) {
        for (const [geometry, instances] of meshGroups) {
            if (instances.length >= OPTIMIZATION_CONFIG.INSTANCE_THRESHOLD) {
                instancedCandidates.push({ material, geometry, instances });
            } else {
                singleInstances.push(...instances);
            }
        }
    }
    
    // Create InstancedMeshes for high-count instances
    for (const candidate of instancedCandidates) {
        if (OPTIMIZATION_CONFIG.USE_BATCHED_MESH && isTransparent === false) {
            // Use BatchedMesh for opaque instances (WebGPU optimized)
            const batchedMeshes = createBatchedMeshes(candidate);
            meshes.push(...batchedMeshes);
        } else {
            // Use InstancedMesh
            const instancedMesh = createInstancedMeshes(candidate);
            if (instancedMesh) meshes.push(instancedMesh);
        }
    }
    
    // Aggressively merge single instances by material
    if (singleInstances.length > 0) {
        const mergedMeshes = mergeInstancesByMaterial(singleInstances, isTransparent);
        meshes.push(...mergedMeshes);
    }
    
    return meshes;
}

function createBatchedMeshes(
    candidate: { material: THREE.Material; geometry: THREE.BufferGeometry; instances: Instance[] }
): THREE.BatchedMesh[] {
    const { material, geometry, instances } = candidate;
    const batchedMeshes: THREE.BatchedMesh[] = [];
    
    // Calculate vertex and index counts
    const vertexCount = geometry.attributes.position?.count || 0;
    const indexCount = geometry.index?.count || 0;
    
    // Split into chunks if too many instances
    for (let i = 0; i < instances.length; i += OPTIMIZATION_CONFIG.MAX_BATCHED_INSTANCES) {
        const chunk = instances.slice(i, i + OPTIMIZATION_CONFIG.MAX_BATCHED_INSTANCES);
        const maxInstanceCount = chunk.length;
        const maxVertexCount = vertexCount * maxInstanceCount;
        const maxIndexCount = indexCount * maxInstanceCount;
        
        // Create BatchedMesh with correct constructor signature
        // BatchedMesh(maxInstanceCount, maxVertexCount, maxIndexCount, material)
        const batchedMesh = new THREE.BatchedMesh(
            maxInstanceCount,
            maxVertexCount,
            maxIndexCount,
            material
        );
        
        // Add geometry to the batched mesh
        const geometryId = batchedMesh.addGeometry(geometry);
        
        // Add instances with their transforms
        const instanceIndices = new Uint32Array(chunk.length);
        for (let j = 0; j < chunk.length; j++) {
            const instance = chunk[j];
            const instanceId = batchedMesh.addInstance(geometryId);
            batchedMesh.setMatrixAt(instanceId, instance.transform);
            instanceIndices[j] = instance.instance;
        }
        
        batchedMesh.frustumCulled = true;
        batchedMesh.castShadow = true;
        batchedMesh.receiveShadow = true;
        batchedMesh.userData.pick = {
            kind: 'batched',
            instanceIndices: instanceIndices
        };
        
        batchedMeshes.push(batchedMesh);
    }
    
    return batchedMeshes;
}

export function createInstancedMeshes(
    candidate: { material: THREE.Material; geometry: THREE.BufferGeometry; instances: Instance[] }
): THREE.InstancedMesh | null {
    const { material, geometry, instances } = candidate;
    const count = instances.length;
    
    if (count === 0) return null;

    const instanced = new THREE.InstancedMesh(geometry, material, count);
    instanced.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const instanceIndices = new Uint32Array(count);
    for (let i = 0; i < count; i++) {
        instanced.setMatrixAt(i, instances[i].transform);
        instanceIndices[i] = instances[i].instance;
    }

    instanced.frustumCulled = true;
    instanced.castShadow = true;
    instanced.receiveShadow = true;
    instanced.userData.pick = {
        kind: 'instanced',
        instanceIndices: instanceIndices
    };
    
    return instanced;
}

function mergeInstancesByMaterial(instances: Instance[], isTransparent: boolean): THREE.Mesh[] {
    if (instances.length === 0) return [];
    
    // Group by material
    const byMaterial = new Map<THREE.Material, Instance[]>();
    for (const instance of instances) {
        let list = byMaterial.get(instance.material);
        if (!list) {
            list = [];
            byMaterial.set(instance.material, list);
        }
        list.push(instance);
    }
    
    const meshes: THREE.Mesh[] = [];
    
    for (const [material, matInstances] of byMaterial) {
        // Split into chunks if geometry would be too large
        let currentChunk: Instance[] = [];
        let currentVertices = 0;
        
        for (const instance of matInstances) {
            const geom = instance.geometry;
            const vertexCount = geom.attributes.position?.count || 0;
            
            if (currentVertices + vertexCount > OPTIMIZATION_CONFIG.MAX_MERGED_VERTICES && currentChunk.length > 0) {
                // Merge current chunk
                const merged = mergeInstanceChunk(currentChunk, material, isTransparent);
                if (merged) meshes.push(merged);
                currentChunk = [];
                currentVertices = 0;
            }
            
            currentChunk.push(instance);
            currentVertices += vertexCount;
        }
        
        // Merge remaining chunk
        if (currentChunk.length > 0) {
            const merged = mergeInstanceChunk(currentChunk, material, isTransparent);
            if (merged) meshes.push(merged);
        }
    }
    
    return meshes;
}

export function createMergedAndSingleMeshes(materialGroups: Array<{ material: THREE.Material; instances: Instance[] }>): THREE.Mesh[] {
    const allInstances: Instance[] = [];
    for (const group of materialGroups) {
        allInstances.push(...group.instances);
    }
    return mergeInstancesByMaterial(allInstances, false);
}

function mergeInstanceChunk(instances: Instance[], material: THREE.Material, isTransparent: boolean): THREE.Mesh | null {
    if (instances.length === 0) return null;
    
    if (instances.length === 1) {
        // Single instance - create simple mesh
        const instance = instances[0];
        const mesh = new THREE.Mesh(instance.geometry, material);
        mesh.matrixAutoUpdate = false;
        mesh.matrix.copy(instance.transform);
        mesh.userData.pick = {
            kind: 'single',
            instanceIndex: instance.instance
        };
        return mesh;
    }
    
    // Merge multiple instances
    const geomsToMerge: THREE.BufferGeometry[] = [];
    const instanceIndices: number[] = [];
    
    for (const instance of instances) {
        const geom = instance.isIdentity 
            ? instance.geometry 
            : instance.geometry.clone().applyMatrix4(instance.transform);
        geomsToMerge.push(geom);
        instanceIndices.push(instance.instance);
    }
    
    const { geometry: mergedGeometry, triToInstanceIndex } = mergeGeometries(geomsToMerge);
    const mergedMesh = new THREE.Mesh(mergedGeometry, material);
    
    // Store triangle-to-instance mapping for picking
    const triToInstanceIndexMap = new Uint32Array(triToInstanceIndex.length);
    for (let i = 0; i < triToInstanceIndex.length; i++) {
        triToInstanceIndexMap[i] = instanceIndices[triToInstanceIndex[i]];
    }
    
    mergedMesh.userData.pick = {
        kind: 'merged',
        triToInstanceIndex: triToInstanceIndexMap
    };
    
    // Optimize for rendering
    mergedMesh.frustumCulled = true;
    if (!isTransparent) {
        mergedMesh.castShadow = true;
        mergedMesh.receiveShadow = true;
    }
    
    return mergedMesh;
}

export function mergeGeometries(geometries: Array<THREE.BufferGeometry>)
    : { geometry: THREE.BufferGeometry; triToInstanceIndex: Uint32Array }
{
    let indexCount = 0;
    let posCount = 0;

    // First pass: gather counts
    for (let i = 0, l = geometries.length; i < l; i++) {
        const geometry = geometries[i];
        const index = geometry.getIndex();
        const position = geometry.getAttribute('position');
        if (index) {
            indexCount += index.count;
        }
        posCount += position.count;
    }

    // Allocated data structures
    const mergedPositions = new Float32Array(posCount * 3);
    const mergedIndices = new Uint32Array(indexCount);
    const triToInstanceIndex = new Uint32Array(indexCount / 3);

    let indexOffset = 0;
    let vertexOffset = 0;

    // Second pass: copy data
    for (let i = 0, l = geometries.length; i < l; i++) {
        const geometry = geometries[i];

        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        const indexAttr = geometry.getIndex() as THREE.BufferAttribute | null;

        if (!indexAttr) continue;

        const srcPosArray = posAttr.array as Float32Array;
        const srcIndexArray = indexAttr.array as Int32Array;

        const vertCount = posAttr.count;
        const idxCount = indexAttr.count;
        const posItemSize = posAttr.itemSize;
        const triCount = idxCount / 3;

        const srcPosLength = vertCount * posItemSize;
        const dstPosOffset = vertexOffset * posItemSize;
        mergedPositions.set(
            srcPosArray.subarray(0, srcPosLength),
            dstPosOffset
        );

        for (let j = 0; j < idxCount; j++) 
            mergedIndices[indexOffset + j] = srcIndexArray[j] + vertexOffset;

        const triStart = indexOffset / 3;
        for (let triIdx = 0; triIdx < triCount; triIdx++) {
            triToInstanceIndex[triStart + triIdx] = i;
        }

        vertexOffset += vertCount;
        indexOffset += idxCount;
    }

    const mergedGeom = new THREE.BufferGeometry();
    mergedGeom.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
    mergedGeom.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
    
    // Compute bounding box for better culling
    mergedGeom.computeBoundingBox();
    mergedGeom.computeBoundingSphere();
    
    return { geometry: mergedGeom, triToInstanceIndex };
}

function groupInstances(instances: Array<Instance>): GroupedInstances {
    const groups: GroupedInstances = new Map();

    for (const inst of instances) {
        if (!inst) continue;
        let matGroup = groups.get(inst.material);
        if (!matGroup) {
            matGroup = new Map();
            groups.set(inst.material, matGroup);
        }

        let meshGroup = matGroup.get(inst.geometry);
        if (!meshGroup) {
            meshGroup = [];
            matGroup.set(inst.geometry, meshGroup);
        }

        meshGroup.push(inst);
    }

    return groups;
}

function calculateStats(root: THREE.Group, _groups: GroupedInstances): DrawCallStats {
    let instancedMeshes = 0;
    let batchedMeshes = 0;
    let mergedMeshes = 0;
    let singleMeshes = 0;
    let totalTriangles = 0;
    let totalVertices = 0;

    root.traverse((child) => {
        if (child instanceof THREE.InstancedMesh) {
            instancedMeshes++;
            const geom = child.geometry;
            const count = child.count;
            const triCount = (geom.index?.count || 0) / 3;
            totalTriangles += triCount * count;
            totalVertices += (geom.attributes.position?.count || 0) * count;
        } else if (child instanceof THREE.BatchedMesh) {
            batchedMeshes++;
            const geom = child.geometry;
            const count = (child as any).maxInstanceCount || 0;
            const triCount = (geom.index?.count || 0) / 3;
            totalTriangles += triCount * count;
            totalVertices += (geom.attributes.position?.count || 0) * count;
        } else if (child instanceof THREE.Mesh) {
            const pickData = child.userData.pick;
            if (pickData?.kind === 'merged') {
                mergedMeshes++;
            } else if (pickData?.kind === 'single') {
                singleMeshes++;
            }
            const geom = child.geometry;
            totalTriangles += (geom.index?.count || 0) / 3;
            totalVertices += geom.attributes.position?.count || 0;
        }
    });

    const totalDrawCalls = instancedMeshes + batchedMeshes + mergedMeshes + singleMeshes;

    return {
        instancedMeshes,
        batchedMeshes,
        mergedMeshes,
        singleMeshes,
        totalDrawCalls,
        totalTriangles,
        totalVertices
    };
}

function logDrawCallStats(stats: DrawCallStats): void {
    console.group('📊 Draw Call Optimization Stats');
    console.log(`Instanced Meshes: ${stats.instancedMeshes}`);
    console.log(`Batched Meshes: ${stats.batchedMeshes}`);
    console.log(`Merged Meshes: ${stats.mergedMeshes}`);
    console.log(`Single Meshes: ${stats.singleMeshes}`);
    console.log(`Total Draw Calls: ${stats.totalDrawCalls}`);
    console.log(`Total Triangles: ${(stats.totalTriangles / 1000000).toFixed(2)}M`);
    console.log(`Total Vertices: ${(stats.totalVertices / 1000000).toFixed(2)}M`);
    console.groupEnd();
}