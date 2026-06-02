import type { VRM } from "@pixiv/three-vrm";

const expressionNameMap: Record<string, string> = {
  blinkLeft: "blinkLeft",
  blinkRight: "blinkRight",
  happy: "happy",
  angry: "angry",
  sad: "sad",
  surprised: "surprised",
};

export function applyExpressions(
  vrm: VRM,
  expressions: Record<string, number>,
) {
  for (const [name, value] of Object.entries(expressions)) {
    vrm.expressionManager?.setValue(expressionNameMap[name] ?? name, value);
  }

  vrm.expressionManager?.update();
}
