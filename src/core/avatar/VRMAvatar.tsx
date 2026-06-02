import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { VRM } from "@pixiv/three-vrm";
import { expressionStore } from "../store/expressionStore";
import { applyExpressions } from "./applyExpressions";
import { applyHeadPose } from "./applyHeadPose";
import { loadVRM } from "./loadVRM";
import { FallbackAvatar } from "./FallbackAvatar";

type VRMAvatarProps = {
  avatarUrl: string;
  onLoadStateChange?: (state: string) => void;
};

export function VRMAvatar({ avatarUrl, onLoadStateChange }: VRMAvatarProps) {
  const [vrm, setVrm] = useState<VRM>();
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    onLoadStateChange?.("Loading VRM avatar");
    loadVRM(avatarUrl)
      .then((loadedVrm) => {
        if (cancelled) {
          return;
        }

        setVrm(loadedVrm);
        setFallback(false);
        onLoadStateChange?.("VRM avatar loaded");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setFallback(true);
        onLoadStateChange?.("Using fallback avatar");
      });

    return () => {
      cancelled = true;
    };
  }, [avatarUrl, onLoadStateChange]);

  useFrame((_, delta) => {
    if (!vrm) {
      return;
    }

    const frame = expressionStore.getState().latestFrame;

    if (frame) {
      applyExpressions(vrm, frame.expressions);
      applyHeadPose(vrm, frame.headPose);
    }

    vrm.update(delta);
  });

  if (fallback || !vrm) {
    return <FallbackAvatar />;
  }

  return <primitive object={vrm.scene} />;
}
