import type { Landmark } from "../core/mediapipe/types";

type LandmarkOverlayProps = {
  landmarks?: Landmark[];
};

export function LandmarkOverlay({ landmarks }: LandmarkOverlayProps) {
  return (
    <svg className="landmark-overlay" viewBox="0 0 1 1" preserveAspectRatio="none">
      {landmarks?.slice(0, 120).map((landmark, index) => (
        <circle
          key={index}
          cx={1 - landmark.x}
          cy={landmark.y}
          r="0.004"
          fill="rgba(66, 167, 124, 0.78)"
        />
      ))}
    </svg>
  );
}
