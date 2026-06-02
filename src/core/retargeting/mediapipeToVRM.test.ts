import { describe, expect, it } from "vitest";
import { applyMapping, getDominantExpression } from "./mediapipeToVRM";

describe("applyMapping", () => {
  it("weights source blendshapes and clamps target expressions", () => {
    const result = applyMapping(
      { jawOpen: 0.9, eyeWideLeft: 1, missing: 0.5 },
      {
        surprised: [
          { input: "jawOpen", weight: 0.8 },
          { input: "eyeWideLeft", weight: 0.4 },
        ],
        happy: [{ input: "mouthSmileLeft", weight: 1 }],
      },
    );

    expect(result.surprised).toBe(1);
    expect(result.happy).toBe(0);
  });
});

describe("getDominantExpression", () => {
  it("ignores blink expressions when choosing the current avatar expression", () => {
    expect(
      getDominantExpression({ blinkLeft: 1, blinkRight: 1, happy: 0.42 }),
    ).toBe("happy");
  });
});
