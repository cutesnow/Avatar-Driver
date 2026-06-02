import type { FaceFrame } from "../mediapipe/types";

export type MappingRule = {
  input: string;
  weight: number;
};

export type MappingConfig = {
  version: string;
  source: string;
  target: string;
  mappings: Record<string, MappingRule[]>;
  smoothing?: {
    enabled: boolean;
    factor: number;
  };
};

export type ExpressionFrame = {
  timestampMs: number;
  expressions: Record<string, number>;
  dominantExpression?: string;
  blendshapes: Record<string, number>;
  sourceFrame: FaceFrame;
  headPose?: {
    rotation: {
      x: number;
      y: number;
      z: number;
    };
  };
};
