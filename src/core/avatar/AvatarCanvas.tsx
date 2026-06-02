import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { FaceMeshAvatar } from "./FaceMeshAvatar";

type AvatarCanvasProps = {
  faceModelUrl: string;
  onLoadStateChange?: (state: string) => void;
};

export function AvatarCanvas({
  faceModelUrl,
  onLoadStateChange,
}: AvatarCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.05, 6.8], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#f4f0e8"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.4} />
      <FaceMeshAvatar
        modelUrl={faceModelUrl}
        onLoadStateChange={onLoadStateChange}
      />
      <Environment preset="city" />
      <OrbitControls
        enablePan={false}
        minDistance={2.4}
        maxDistance={8}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
