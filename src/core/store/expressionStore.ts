import { createStore } from "zustand/vanilla";
import type { ExpressionFrame } from "../expression/expressionTypes";

type ExpressionState = {
  latestFrame?: ExpressionFrame;
  fps: number;
  latencyMs: number;
  mappingProfile: string;
  meshDiagnostics: {
    updateCount: number;
    landmarkCount: number;
    positionCount: number;
    reason: string;
  };
  diagnostics: {
    framesSent: number;
    framesReceived: number;
    facesDetected: number;
    videoWidth: number;
    videoHeight: number;
    workerReady: boolean;
    lastWorkerError?: string;
  };
  setLatestFrame: (frame: ExpressionFrame) => void;
  setPerformance: (performance: { fps?: number; latencyMs?: number }) => void;
  setMappingProfile: (mappingProfile: string) => void;
  setMeshDiagnostics: (
    meshDiagnostics: Partial<ExpressionState["meshDiagnostics"]>,
  ) => void;
  setDiagnostics: (diagnostics: Partial<ExpressionState["diagnostics"]>) => void;
  incrementDiagnostics: (
    key: "framesSent" | "framesReceived" | "facesDetected",
  ) => void;
};

export const expressionStore = createStore<ExpressionState>((set) => ({
  fps: 0,
  latencyMs: 0,
  mappingProfile: "default.vrm.mapping.json",
  meshDiagnostics: {
    updateCount: 0,
    landmarkCount: 0,
    positionCount: 0,
    reason: "idle",
  },
  diagnostics: {
    framesSent: 0,
    framesReceived: 0,
    facesDetected: 0,
    videoWidth: 0,
    videoHeight: 0,
    workerReady: false,
  },
  setLatestFrame: (latestFrame) => set({ latestFrame }),
  setPerformance: (performance) => set(performance),
  setMappingProfile: (mappingProfile) => set({ mappingProfile }),
  setMeshDiagnostics: (meshDiagnostics) =>
    set((state) => ({
      meshDiagnostics: { ...state.meshDiagnostics, ...meshDiagnostics },
    })),
  setDiagnostics: (diagnostics) =>
    set((state) => ({
      diagnostics: { ...state.diagnostics, ...diagnostics },
    })),
  incrementDiagnostics: (key) =>
    set((state) => ({
      diagnostics: {
        ...state.diagnostics,
        [key]: state.diagnostics[key] + 1,
      },
    })),
}));
