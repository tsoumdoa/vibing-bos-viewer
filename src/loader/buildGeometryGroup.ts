import * as THREE from 'three';
import { Instance } from './buildInstances';

type GroupedInstances = Map<THREE.Material, Map<THREE.BufferGeometry, Instance[]>>;

type InstanceMaterialGroup = {
    material: THREE.Material;
    instances: Array<Instance>;
};

export function buildGeometry(instances: Array<Instance | undefined>): THREE.Group {
    console.time('Building geometry');
    const root = new THREE.Group();

    const instanceGroups = groupInstances(instances);
    const materialGroups = gatherSingleInstancesByMaterial(instanceGroups);
    const instancedMeshes = createInstancedMeshes(instanceGroups);
    const nonInstancedMeshes = createMergedAndSingleMeshes(materialGroups);

    let polyCount = 0;
    let drawCalls = 0;

    for (const im of instancedMeshes) {
        const indexCount = im.geometry.index?.count ?? 0;
        polyCount += (indexCount / 3) * im.count;
        drawCalls++;
        root.add(im);
    }

    for (const nim of nonInstancedMeshes) {
        const indexCount = nim.geometry.index?.count ?? 0;
        polyCount += indexCount / 3;
        drawCalls++;
        root.add(nim);
    }

    root.rotation.x = -Math.PI / 2;

    console.timeEnd('Building geometry');
    console.log(`[Optimization] Polygons: ${polyCount.toLocaleString()}, Draw Calls: ${drawCalls}, Instanced Meshes: ${instancedMeshes.length}, Merged Meshes: ${nonInstancedMeshes.length}`);

    return root;
}

export function createMergedAndSingleMeshes(materialGroups: Array<InstanceMaterialGroup>)
    : Array<THREE.Mesh>
{
    const r: THREE.Mesh[] = [];

    for (const materialGroup of materialGroups)
    {
        const n = materialGroup.instances.length;
        if (n === 0) continue;

        const material = materialGroup.material;
        const geomsToMerge: THREE.BufferGeometry[] = [];
        const instanceIndices: number[] = [];

        for (const i of materialGroup.instances) {
            const posAttr = i.geometry.getAttribute('position');
            const indexAttr = i.geometry.getIndex();

            if (!posAttr || posAttr.count === 0) continue;
            if (indexAttr && indexAttr.count === 0) continue;

            const geom = i.isIdentity ? i.geometry : i.geometry.clone().applyMatrix4(i.transform);
            geomsToMerge.push(geom);
            instanceIndices.push(i.instance);
        }

        if (geomsToMerge.length === 0) continue;

        const { geometry: mergedGeometry, triToInstanceIndex } = mergeGeometries(geomsToMerge);
        const mergedMesh = new THREE.Mesh(mergedGeometry, material);
        mergedMesh.name = `MergedStatic_Material_${material.uuid}`;
        mergedMesh.matrixAutoUpdate = false;
        mergedMesh.matrixWorldNeedsUpdate = false;

        const triToInstanceIndexMap = new Uint32Array(triToInstanceIndex.length);
        for (let i = 0; i < triToInstanceIndex.length; i++) {
            triToInstanceIndexMap[i] = instanceIndices[triToInstanceIndex[i]];
        }
        mergedMesh.userData.pick = {
            kind: 'merged',
            triToInstanceIndex: triToInstanceIndexMap
        };
        r.push(mergedMesh);
    }

    return r;
}

export function mergeGeometries(geometries: Array<THREE.BufferGeometry>)
    : { geometry: THREE.BufferGeometry; triToInstanceIndex: Uint32Array }
{
    let indexCount = 0;
    let posCount = 0;
    let validGeoms: number[] = [];

    for (let i = 0, l = geometries.length; i < l; i++) {
        const geometry = geometries[i];
        const index = geometry.getIndex();
        const position = geometry.getAttribute('position');

        if (!position || position.count === 0) continue;
        if (!index || index.count === 0) continue;

        indexCount += index.count;
        posCount += position.count;
        validGeoms.push(i);
    }

    if (validGeoms.length === 0) {
        const emptyGeom = new THREE.BufferGeometry();
        return { geometry: emptyGeom, triToInstanceIndex: new Uint32Array(0) };
    }

    const mergedPositions = new Float32Array(posCount * 3);
    const mergedIndices = new Uint32Array(indexCount);
    const triToInstanceIndex = new Uint32Array(indexCount / 3);

    let indexOffset = 0;
    let vertexOffset = 0;

    for (const geomIndex of validGeoms) {
        const geometry = geometries[geomIndex];
        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        const indexAttr = geometry.getIndex() as THREE.BufferAttribute;

        const srcPosArray = posAttr.array as Float32Array;
        const srcIndexArray = indexAttr.array as Int32Array;

        const vertCount = posAttr.count;
        const idxCount = indexAttr.count;
        const posItemSize = posAttr.itemSize;
        const triCount = idxCount / 3;

        const srcPosLength = vertCount * posItemSize;
        const dstPosOffset = vertexOffset * posItemSize;
        mergedPositions.set(srcPosArray.subarray(0, srcPosLength), dstPosOffset);

        for (let j = 0; j < idxCount; j++)
            mergedIndices[indexOffset + j] = srcIndexArray[j] + vertexOffset;

        const triStart = indexOffset / 3;
        for (let triIdx = 0; triIdx < triCount; triIdx++) {
            triToInstanceIndex[triStart + triIdx] = geomIndex;
        }

        vertexOffset += vertCount;
        indexOffset += idxCount;
    }

    const mergedGeom = new THREE.BufferGeometry();
    mergedGeom.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
    mergedGeom.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
    return { geometry: mergedGeom, triToInstanceIndex };
}

function groupInstances(instances: Array<Instance | undefined>): GroupedInstances {
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

export function gatherSingleInstancesByMaterial(groups: GroupedInstances)
    : Array<InstanceMaterialGroup> 
{
    const r = new Array<InstanceMaterialGroup>();
    for (const [material, meshGroups] of groups) {
        let instances = [];
        for (const [, group] of meshGroups) {
            if (group.length != 1) continue;
            instances.push(group[0]);
        }
        if (instances.length < 1) continue;
        r.push({ material, instances });
    }
    return r;
}

export function createInstancedMeshes(instanceGroups: GroupedInstances)
    : Array<THREE.InstancedMesh>
{
    const r = new Array<THREE.InstancedMesh>();
    for (const [material, meshGroups] of instanceGroups)
    {
        for (const [geometry, instances] of meshGroups)
        {
            const count = instances.length;

            if (count <= 1)
                continue;

            const posAttr = geometry.getAttribute('position');
            if (!posAttr || posAttr.count === 0) continue;

            const instanced = new THREE.InstancedMesh(geometry, material, count);
            instanced.instanceMatrix.setUsage(THREE.StaticDrawUsage);

            const instanceIndices = new Uint32Array(count);
            for (let i = 0; i < count; i++) {
                instanced.setMatrixAt(i, instances[i].transform);
                instanceIndices[i] = instances[i].instance;
            }

            instanced.frustumCulled = false;
            instanced.matrixAutoUpdate = false;
            instanced.matrixWorldNeedsUpdate = false;
            instanced.userData.pick = {
                kind: 'instanced',
                instanceIndices: instanceIndices
            };
            r.push(instanced);
        }
    }
    return r;
}
