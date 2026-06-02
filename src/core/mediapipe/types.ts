export type Landmark = {
  x: number;
  y: number;
  z: number;
};

export type FaceFrame = {
  timestampMs: number;
  detected: boolean;
  blendshapes: Record<string, number>;
  landmarks?: Landmark[];
  headPose?: {
    rotation: {
      x: number;
      y: number;
      z: number;
    };
    matrix?: number[];
  };
};

export type WorkerInitMessage = {
  type: "init";
  modelPath: string;
  wasmBasePath: string;
};

export type WorkerFrameMessage = {
  type: "detect";
  bitmap: ImageBitmap;
  timestampMs: number;
};

export type WorkerRequest = WorkerInitMessage | WorkerFrameMessage;

export type WorkerResponse =
  | { type: "ready" }
  | { type: "result"; frame: FaceFrame; latencyMs: number }
  | { type: "error"; message: string };
