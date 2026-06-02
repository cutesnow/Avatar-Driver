import type { Object3D } from "three";
import type { VRM } from "@pixiv/three-vrm";
import type { ExpressionFrame } from "../expression/expressionTypes";

type HumanoidWithBoneLookup = {
  getNormalizedBoneNode?: (name: string) => Object3D | null;
  getRawBoneNode?: (name: string) => Object3D | null;
};

export function applyHeadPose(vrm: VRM, headPose: ExpressionFrame["headPose"]) {
  if (!headPose) {
    return;
  }

  const humanoid = vrm.humanoid as HumanoidWithBoneLookup | undefined;
  const head =
    humanoid?.getNormalizedBoneNode?.("head") ?? humanoid?.getRawBoneNode?.("head");

  if (!head) {
    return;
  }

  head.rotation.x = damp(head.rotation.x, headPose.rotation.x * 0.45, 0.25);
  head.rotation.y = damp(head.rotation.y, headPose.rotation.y * 0.65, 0.25);
  head.rotation.z = damp(head.rotation.z, -headPose.rotation.z * 0.45, 0.25);
}

function damp(current: number, target: number, factor: number) {
  return current + (target - current) * factor;
}
