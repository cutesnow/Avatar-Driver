import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { expressionStore } from "../store/expressionStore";
import type { Landmark } from "../mediapipe/types";

type FaceMeshAvatarProps = {
  modelUrl: string;
  onLoadStateChange?: (state: string) => void;
};

type AvatarMeshDebugState = {
  updateCount: number;
  landmarkCount: number;
  positionCount: number;
  reason: string;
  sample: number[];
};

declare global {
  interface Window {
    __AVATAR_MESH_DEBUG__?: AvatarMeshDebugState;
  }
}

const UPPER_LIP = new Set([0, 13, 37, 39, 40, 267, 269, 270, 312]);
const LOWER_LIP = new Set([14, 17, 84, 87, 178, 181, 314, 317, 402, 405]);
const MOUTH_LEFT = new Set([61, 76, 78, 146, 185]);
const MOUTH_RIGHT = new Set([291, 306, 308, 375, 409]);
const LEFT_EYE_TOP = new Set([159, 160, 161, 158, 157, 173]);
const LEFT_EYE_BOTTOM = new Set([145, 144, 163, 153, 154, 155]);
const RIGHT_EYE_TOP = new Set([386, 385, 384, 387, 388, 466]);
const RIGHT_EYE_BOTTOM = new Set([374, 373, 390, 380, 381, 382]);
const LEFT_BROW = new Set([46, 52, 53, 65, 66, 70, 105, 107]);
const RIGHT_BROW = new Set([276, 282, 283, 295, 296, 300, 334, 336]);
const CHIN = new Set([152, 148, 149, 150, 175, 176, 199, 200]);

export function FaceMeshAvatar({
  modelUrl,
  onLoadStateChange,
}: FaceMeshAvatarProps) {
  const groupRef = useRef<Group>(null);
  const deformableMeshesRef = useRef<Mesh[]>([]);
  const [sourceGeometry, setSourceGeometry] = useState<BufferGeometry>();

  useEffect(() => {
    let cancelled = false;

    fetch(modelUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load face mesh: ${response.status}`);
        }
        return response.text();
      })
      .then((obj) => {
        if (!cancelled) {
          setSourceGeometry(parseIndexedObjGeometry(obj));
        }
      })
      .catch((error) => {
        onLoadStateChange?.(
          error instanceof Error ? error.message : "Face mesh failed to load",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [modelUrl, onLoadStateChange]);

  const mesh = useMemo(() => {
    const group = new Group();
    if (!sourceGeometry) {
      return group;
    }

    const model = new Group();
    const face = new Mesh(sourceGeometry.clone());
    const bounds = new Box3().setFromObject(model);
    const size = new Vector3();
    const center = new Vector3();

    model.add(face);
    bounds.setFromObject(model);
    bounds.getSize(size);
    bounds.getCenter(center);

    model.position.sub(center);
    model.scale.setScalar(3.35 / Math.max(size.x, size.y, size.z));

    deformableMeshesRef.current = [];

    for (const child of [face]) {
      child.geometry = child.geometry.clone();
      const position = child.geometry.attributes.position;
      if (position instanceof BufferAttribute) {
        position.setUsage(DynamicDrawUsage);
      }
      deformableMeshesRef.current.push(child);

      child.material = new MeshBasicMaterial({
        color: "#f2c7aa",
        opacity: 0.46,
        transparent: true,
        depthWrite: false,
      });

      const wireframe = new Mesh(
        child.geometry,
        new MeshBasicMaterial({
          color: "#21756f",
          transparent: true,
          opacity: 0.92,
          wireframe: true,
        }),
      );
      child.add(wireframe);
    }

    group.add(model);
    return group;
  }, [sourceGeometry]);

  useEffect(() => {
    if (sourceGeometry) {
      onLoadStateChange?.("Face mesh loaded");
    }
  }, [onLoadStateChange, sourceGeometry]);

  useFrame(() => {
    const frame = expressionStore.getState().latestFrame;
    const headPose = frame?.headPose?.rotation;
    const landmarks = frame?.sourceFrame.landmarks;
    const blendshapes = frame?.blendshapes ?? {};
    const expressionDiagnostics = expressionStore.getState();

    if (!landmarks?.length) {
      setMeshDebug({
        updateCount: window.__AVATAR_MESH_DEBUG__?.updateCount ?? 0,
        landmarkCount: 0,
        positionCount: 0,
        reason: "no-landmarks",
        sample: [],
      });
    } else {
      for (const mesh of deformableMeshesRef.current) {
        const position = mesh.geometry.attributes.position;

        if (!(position instanceof BufferAttribute)) {
          setMeshDebug({
            updateCount: window.__AVATAR_MESH_DEBUG__?.updateCount ?? 0,
            landmarkCount: landmarks.length,
            positionCount: position.count,
            reason: "unsupported-position-attribute",
            sample: [],
          });
          continue;
        }

        if (position.count > landmarks.length) {
          setMeshDebug({
            updateCount: window.__AVATAR_MESH_DEBUG__?.updateCount ?? 0,
            landmarkCount: landmarks.length,
            positionCount: position.count,
            reason: "count-mismatch",
            sample: [],
          });
          continue;
        }

        const meshLandmarks = landmarks.slice(0, position.count);
        const bounds = getLandmarkBounds(meshLandmarks);

        for (let index = 0; index < position.count; index += 1) {
          const landmark = meshLandmarks[index];
          let targetX =
            ((bounds.centerX - landmark.x) / bounds.width) * 15.5;
          let targetY =
            ((bounds.centerY - landmark.y) / bounds.height) * 17.7;
          let targetZ =
            ((bounds.centerZ - landmark.z) / bounds.width) * 12.5 + 2.4;

          const expressionOffset = getExpressionOffset(index, blendshapes);
          targetX += expressionOffset.x;
          targetY += expressionOffset.y;
          targetZ += expressionOffset.z;

          const currentX = position.getX(index);
          const currentY = position.getY(index);
          const currentZ = position.getZ(index);

          position.setXYZ(
            index,
            currentX + (targetX - currentX) * 0.48,
            currentY + (targetY - currentY) * 0.48,
            currentZ + (targetZ - currentZ) * 0.48,
          );
        }

        position.needsUpdate = true;
        mesh.geometry.computeBoundingSphere();

        const updateCount =
          (expressionDiagnostics.meshDiagnostics.updateCount ?? 0) + 1;
        setMeshDebug({
          updateCount,
          landmarkCount: landmarks.length,
          positionCount: position.count,
          reason: "updated",
          sample: [
            position.getX(10),
            position.getY(10),
            position.getZ(10),
            position.getX(13),
            position.getY(13),
            position.getZ(13),
            position.getX(152),
            position.getY(152),
            position.getZ(152),
          ],
        });
      }
    }

    if (groupRef.current && headPose) {
      groupRef.current.rotation.x = headPose.x * 0.18;
      groupRef.current.rotation.y = headPose.y * 0.28;
      groupRef.current.rotation.z = -headPose.z * 0.18;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={mesh} />
    </group>
  );
}

function getLandmarkBounds(landmarks: Landmark[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const landmark of landmarks) {
    minX = Math.min(minX, landmark.x);
    maxX = Math.max(maxX, landmark.x);
    minY = Math.min(minY, landmark.y);
    maxY = Math.max(maxY, landmark.y);
    minZ = Math.min(minZ, landmark.z);
    maxZ = Math.max(maxZ, landmark.z);
  }

  const width = Math.max(0.001, maxX - minX);
  const height = Math.max(0.001, maxY - minY);

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    centerZ: (minZ + maxZ) / 2,
    width,
    height,
  };
}

function setMeshDebug(debug: AvatarMeshDebugState) {
  window.__AVATAR_MESH_DEBUG__ = debug;
  expressionStore.getState().setMeshDiagnostics({
    updateCount: debug.updateCount,
    landmarkCount: debug.landmarkCount,
    positionCount: debug.positionCount,
    reason: debug.reason,
  });
}

function getExpressionOffset(
  index: number,
  blendshapes: Record<string, number>,
) {
  const jawOpen = score(blendshapes, "jawOpen");
  const smileLeft = score(blendshapes, "mouthSmileLeft");
  const smileRight = score(blendshapes, "mouthSmileRight");
  const blinkLeft = score(blendshapes, "eyeBlinkLeft");
  const blinkRight = score(blendshapes, "eyeBlinkRight");
  const browUp = score(blendshapes, "browInnerUp");
  const browDownLeft = score(blendshapes, "browDownLeft");
  const browDownRight = score(blendshapes, "browDownRight");

  let x = 0;
  let y = 0;
  let z = 0;

  if (UPPER_LIP.has(index)) {
    y += jawOpen * 0.65;
    z += jawOpen * 0.35;
  }

  if (LOWER_LIP.has(index)) {
    y -= jawOpen * 1.55;
    z += jawOpen * 0.45;
  }

  if (CHIN.has(index)) {
    y -= jawOpen * 1.35;
    z += jawOpen * 0.3;
  }

  if (MOUTH_LEFT.has(index)) {
    x += smileLeft * 1.2;
    y += smileLeft * 0.85;
    z += smileLeft * 0.18;
  }

  if (MOUTH_RIGHT.has(index)) {
    x -= smileRight * 1.2;
    y += smileRight * 0.85;
    z += smileRight * 0.18;
  }

  if (LEFT_EYE_TOP.has(index)) {
    y -= blinkLeft * 0.55;
  }

  if (LEFT_EYE_BOTTOM.has(index)) {
    y += blinkLeft * 0.5;
  }

  if (RIGHT_EYE_TOP.has(index)) {
    y -= blinkRight * 0.55;
  }

  if (RIGHT_EYE_BOTTOM.has(index)) {
    y += blinkRight * 0.5;
  }

  if (LEFT_BROW.has(index)) {
    y += browUp * 0.8;
    y -= browDownLeft * 0.65;
  }

  if (RIGHT_BROW.has(index)) {
    y += browUp * 0.8;
    y -= browDownRight * 0.65;
  }

  return { x, y, z };
}

function score(blendshapes: Record<string, number>, name: string) {
  return Math.max(0, Math.min(1, blendshapes[name] ?? 0));
}

function parseIndexedObjGeometry(obj: string) {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (const line of obj.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v") {
      vertices.push(Number(parts[1]), Number(parts[2]), Number(parts[3]));
    }

    if (parts[0] === "f") {
      for (const ref of parts.slice(1)) {
        const vertexIndex = Number(ref.split("/")[0]);
        indices.push(vertexIndex - 1);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertices), 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
