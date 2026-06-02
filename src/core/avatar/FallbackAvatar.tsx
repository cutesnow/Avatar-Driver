import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Line,
  LineBasicMaterial,
  QuadraticBezierCurve3,
  Vector3,
} from "three";
import type { Group, Mesh } from "three";
import { expressionStore } from "../store/expressionStore";

const eyeBaseScale = {
  x: 0.16,
  y: 0.09,
  z: 1,
};

type CurveLineProps = {
  points: Vector3[];
  color: string;
};

function CurveLine({ points, color }: CurveLineProps) {
  const line = useMemo(
    () =>
      new Line(
        new BufferGeometry().setFromPoints(points),
        new LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.72,
        }),
      ),
    [color, points],
  );

  return <primitive object={line} />;
}

function ellipsePoints(
  radiusX: number,
  radiusY: number,
  z: number,
  segments = 72,
  start = 0,
  end = Math.PI * 2,
) {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = start + ((end - start) * index) / segments;
    return new Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, z);
  });
}

function curvePoints(curve: CatmullRomCurve3 | QuadraticBezierCurve3) {
  return curve.getPoints(36);
}

export function FallbackAvatar() {
  const groupRef = useRef<Group>(null);
  const leftEyeRef = useRef<Mesh>(null);
  const rightEyeRef = useRef<Mesh>(null);
  const leftBrowRef = useRef<Group>(null);
  const rightBrowRef = useRef<Group>(null);
  const smileMouthRef = useRef<Group>(null);
  const openMouthRef = useRef<Mesh>(null);

  const faceGrid = useMemo(() => {
    const horizontal = [-0.62, -0.36, -0.08, 0.2, 0.48].map((y) => {
      const width = Math.sqrt(Math.max(0, 1 - (y / 1.05) ** 2)) * 0.78;
      return ellipsePoints(width, 0.03, 0.035, 36).map(
        (point) => new Vector3(point.x, y + point.y, point.z),
      );
    });

    const vertical = [-0.48, -0.24, 0, 0.24, 0.48].map((x) => {
      const height = Math.sqrt(Math.max(0, 1 - (x / 0.82) ** 2)) * 1.02;
      return ellipsePoints(0.025, height, 0.036, 36).map(
        (point) => new Vector3(x + point.x, point.y, point.z),
      );
    });

    return [...horizontal, ...vertical];
  }, []);

  const landmarkDots = useMemo(
    () => [
      [-0.44, 0.23],
      [-0.32, 0.24],
      [-0.2, 0.22],
      [0.2, 0.22],
      [0.32, 0.24],
      [0.44, 0.23],
      [-0.3, 0.48],
      [0.3, 0.48],
      [0, 0.12],
      [-0.08, -0.1],
      [0.08, -0.1],
      [-0.35, -0.34],
      [-0.16, -0.45],
      [0, -0.48],
      [0.16, -0.45],
      [0.35, -0.34],
      [-0.62, 0],
      [0.62, 0],
      [-0.48, -0.72],
      [0.48, -0.72],
    ],
    [],
  );

  const browCurve = useMemo(
    () =>
      curvePoints(
        new CatmullRomCurve3([
          new Vector3(-0.18, 0, 0.07),
          new Vector3(0, 0.04, 0.07),
          new Vector3(0.18, 0, 0.07),
        ]),
      ),
    [],
  );

  const smileCurve = useMemo(
    () =>
      curvePoints(
        new QuadraticBezierCurve3(
          new Vector3(-0.38, -0.34, 0.07),
          new Vector3(0, -0.54, 0.07),
          new Vector3(0.38, -0.34, 0.07),
        ),
      ),
    [],
  );

  const noseCurve = useMemo(
    () =>
      curvePoints(
        new CatmullRomCurve3([
          new Vector3(0, 0.1, 0.06),
          new Vector3(-0.05, -0.04, 0.06),
          new Vector3(0.02, -0.18, 0.06),
          new Vector3(0.1, -0.17, 0.06),
        ]),
      ),
    [],
  );

  useFrame(() => {
    const frame = expressionStore.getState().latestFrame;
    const expressions = frame?.expressions ?? {};
    const headPose = frame?.headPose?.rotation;
    const happy = expressions.happy ?? 0;
    const surprised = expressions.surprised ?? 0;
    const angry = expressions.angry ?? 0;
    const sad = expressions.sad ?? 0;

    if (groupRef.current && headPose) {
      groupRef.current.rotation.x = headPose.x * 0.25;
      groupRef.current.rotation.y = headPose.y * 0.45;
      groupRef.current.rotation.z = -headPose.z * 0.25;
    }

    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y =
        eyeBaseScale.y * Math.max(0.08, 1 - (expressions.blinkLeft ?? 0));
    }

    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y =
        eyeBaseScale.y * Math.max(0.08, 1 - (expressions.blinkRight ?? 0));
    }

    if (leftBrowRef.current) {
      leftBrowRef.current.position.y = 0.56 + surprised * 0.1 - sad * 0.06;
      leftBrowRef.current.rotation.z = angry * -0.45 + sad * 0.28;
    }

    if (rightBrowRef.current) {
      rightBrowRef.current.position.y = 0.56 + surprised * 0.1 - sad * 0.06;
      rightBrowRef.current.rotation.z = angry * 0.45 - sad * 0.28;
    }

    if (smileMouthRef.current) {
      smileMouthRef.current.visible = surprised < 0.35;
      smileMouthRef.current.scale.set(1 + happy * 0.28, 1 + happy * 0.16, 1);
      smileMouthRef.current.rotation.z = sad * Math.PI;
    }

    if (openMouthRef.current) {
      openMouthRef.current.visible = surprised >= 0.18;
      openMouthRef.current.scale.set(
        0.14 + surprised * 0.2,
        0.1 + surprised * 0.42,
        1,
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.02, 0]} scale={1.25}>
      <mesh scale={[0.82, 1.05, 1]}>
        <circleGeometry args={[1, 96]} />
        <meshBasicMaterial color="#f3c6a5" />
      </mesh>

      <CurveLine points={ellipsePoints(0.82, 1.05, 0.04)} color="#7a5a4e" />
      {faceGrid.map((points, index) => (
        <CurveLine key={index} points={points} color="#c88f7d" />
      ))}

      {landmarkDots.map(([x, y], index) => (
        <mesh key={index} position={[x, y, 0.08]} scale={[0.025, 0.025, 1]}>
          <circleGeometry args={[1, 12]} />
          <meshBasicMaterial color="#3f7f78" />
        </mesh>
      ))}

      <group ref={leftBrowRef} position={[-0.32, 0.56, 0]}>
        <CurveLine points={browCurve} color="#2c1f19" />
      </group>
      <group ref={rightBrowRef} position={[0.32, 0.56, 0]}>
        <CurveLine points={browCurve} color="#2c1f19" />
      </group>

      <mesh
        ref={leftEyeRef}
        position={[-0.32, 0.25, 0.08]}
        scale={[eyeBaseScale.x, eyeBaseScale.y, eyeBaseScale.z]}
      >
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#241a16" />
      </mesh>

      <mesh
        ref={rightEyeRef}
        position={[0.32, 0.25, 0.08]}
        scale={[eyeBaseScale.x, eyeBaseScale.y, eyeBaseScale.z]}
      >
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#241a16" />
      </mesh>

      <CurveLine points={noseCurve} color="#8f6759" />

      <group ref={smileMouthRef}>
        <CurveLine points={smileCurve} color="#8d2e24" />
      </group>

      <mesh ref={openMouthRef} position={[0, -0.4, 0.09]} visible={false}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#3a1614" />
      </mesh>
    </group>
  );
}
