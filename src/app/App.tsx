import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarCanvas } from "../core/avatar/AvatarCanvas";
import { createCameraStream } from "../core/camera/createCameraStream";
import { startVideoFrameLoop } from "../core/camera/videoFrameLoop";
import { normalizeBlendshapes } from "../core/expression/normalizeBlendshapes";
import { smoothExpression } from "../core/expression/smoothExpression";
import type {
  ExpressionFrame,
  MappingConfig,
} from "../core/expression/expressionTypes";
import type { WorkerResponse } from "../core/mediapipe/types";
import { fallbackMappingConfig } from "../core/retargeting/defaultMappings";
import { getDominantExpression, applyMapping } from "../core/retargeting/mediapipeToVRM";
import { loadMappingConfig } from "../core/retargeting/retargetConfig";
import { expressionStore } from "../core/store/expressionStore";
import { LandmarkOverlay } from "../debug/LandmarkOverlay";
import { FaceDebugPanel } from "../debug/FaceDebugPanel";
import { assetUrl } from "../utils/assetUrl";

const modelPath = assetUrl("models/face_landmarker.task");
const faceModelPath = assetUrl("models/canonical_face_model.obj");
const mappingPath = assetUrl("mappings/default.vrm.mapping.json");
const faceWorkerPath = assetUrl("workers/faceLandmarker.worker.js");
const wasmBasePath = assetUrl("wasm");
const docsPath = assetUrl("docs/");

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const workerRef = useRef<Worker>();
  const trackerInitPromiseRef = useRef<Promise<void>>();
  const stopSessionRef = useRef<() => void>();
  const abortControllerRef = useRef<AbortController>();
  const startingRef = useRef(false);
  const startSequenceRef = useRef(0);
  const workerBusyRef = useRef(false);
  const workerReadyRef = useRef(false);
  const previousExpressionsRef = useRef<Record<string, number>>();
  const mappingRef = useRef<MappingConfig>(fallbackMappingConfig);
  const lastResultAtRef = useRef(performance.now());
  const [cameraState, setCameraState] = useState("Camera idle");
  const [trackingState, setTrackingState] = useState("Tracker idle");
  const [avatarState, setAvatarState] = useState("Avatar idle");
  const [error, setError] = useState<string>();
  const [debugVisible, setDebugVisible] = useState(true);
  const [landmarksVisible, setLandmarksVisible] = useState(true);
  const [latestFrame, setLatestFrame] = useState<ExpressionFrame>();

  const stopSession = useCallback(() => {
    startSequenceRef.current += 1;
    startingRef.current = false;
    abortControllerRef.current?.abort();
    abortControllerRef.current = undefined;
    stopSessionRef.current?.();
    stopSessionRef.current = undefined;
    workerBusyRef.current = false;

    const video = videoRef.current;
    const stream = video?.srcObject;

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }, []);

  const processFaceResult = useCallback((response: WorkerResponse) => {
    workerBusyRef.current = false;

    if (response.type === "ready") {
      workerReadyRef.current = true;
      expressionStore
        .getState()
        .setDiagnostics({ workerReady: true, lastWorkerError: undefined });
      setTrackingState("Tracker ready");
      return;
    }

    if (response.type === "error") {
      workerReadyRef.current = false;
      expressionStore
        .getState()
        .setDiagnostics({ workerReady: false, lastWorkerError: response.message });
      setTrackingState("Tracker error");
      setError(response.message);
      return;
    }

    expressionStore.getState().incrementDiagnostics("framesReceived");
    const faceFrame = response.frame;
    if (faceFrame.detected) {
      expressionStore.getState().incrementDiagnostics("facesDetected");
    }
    const blendshapes = normalizeBlendshapes(faceFrame.blendshapes);
    const mappedExpressions = applyMapping(
      blendshapes,
      mappingRef.current.mappings,
    );
    const smoothing = mappingRef.current.smoothing;
    const expressions =
      smoothing?.enabled === false
        ? mappedExpressions
        : smoothExpression(
            previousExpressionsRef.current,
            mappedExpressions,
            smoothing?.factor ?? 0.65,
          );

    previousExpressionsRef.current = expressions;

    const expressionFrame: ExpressionFrame = {
      timestampMs: faceFrame.timestampMs,
      blendshapes,
      expressions,
      dominantExpression: getDominantExpression(expressions),
      headPose: faceFrame.headPose
        ? { rotation: faceFrame.headPose.rotation }
        : undefined,
      sourceFrame: faceFrame,
    };

    const now = performance.now();
    const fps = 1000 / Math.max(1, now - lastResultAtRef.current);
    lastResultAtRef.current = now;

    expressionStore.getState().setLatestFrame(expressionFrame);
    expressionStore
      .getState()
      .setPerformance({ fps, latencyMs: response.latencyMs });
    setLatestFrame(expressionFrame);
  }, []);

  const ensureTrackerReady = useCallback(() => {
    if (workerReadyRef.current && workerRef.current) {
      expressionStore.getState().setDiagnostics({ workerReady: true });
      setTrackingState("Tracker ready");
      return Promise.resolve();
    }

    if (trackerInitPromiseRef.current) {
      return trackerInitPromiseRef.current;
    }

    setTrackingState("Loading tracker");

    const worker = new Worker(faceWorkerPath);
    workerReadyRef.current = false;
    workerBusyRef.current = false;
    workerRef.current = worker;

    trackerInitPromiseRef.current = new Promise<void>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        processFaceResult(event.data);

        if (event.data.type === "ready") {
          resolve();
        }

        if (event.data.type === "error") {
          trackerInitPromiseRef.current = undefined;
          reject(new Error(event.data.message));
        }
      };
    });

    worker.postMessage({
      type: "init",
      modelPath,
      wasmBasePath,
    });

    return trackerInitPromiseRef.current;
  }, [processFaceResult]);

  const start = useCallback(async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (startingRef.current) {
      return;
    }

    startingRef.current = true;
    stopSession();
    startingRef.current = true;
    const startId = startSequenceRef.current + 1;
    startSequenceRef.current = startId;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setError(undefined);
      setCameraState("Requesting camera");

      mappingRef.current = await loadMappingConfig(mappingPath).catch(
        () => fallbackMappingConfig,
      );
      expressionStore.getState().setMappingProfile(mappingRef.current.version);
      void ensureTrackerReady().catch((trackerError) => {
        setError(
          trackerError instanceof Error
            ? trackerError.message
            : String(trackerError),
        );
      });

      if (startId !== startSequenceRef.current) {
        return;
      }

      const stream = await createCameraStream(video, abortController.signal);

      if (startId !== startSequenceRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      startingRef.current = false;
      setCameraState("Camera running");
      await ensureTrackerReady();

      if (startId !== startSequenceRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      expressionStore.getState().setDiagnostics({
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        framesSent: 0,
        framesReceived: 0,
        facesDetected: 0,
        workerReady: workerReadyRef.current,
        lastWorkerError: undefined,
      });

      workerBusyRef.current = false;

      const stopLoop = startVideoFrameLoop({
        video,
        targetFps: 30,
        onFrame: (bitmap, timestampMs) => {
          if (
            workerBusyRef.current ||
            !workerReadyRef.current ||
            !workerRef.current
          ) {
            bitmap.close();
            return;
          }

          workerBusyRef.current = true;
          expressionStore.getState().incrementDiagnostics("framesSent");
          workerRef.current.postMessage(
            { type: "detect", bitmap, timestampMs },
            [bitmap],
          );
        },
      });

      stopSessionRef.current = () => {
        stopLoop();
        workerBusyRef.current = false;
        stream.getTracks().forEach((track) => track.stop());
      };
    } catch (startError) {
      startingRef.current = false;
      if (
        startId !== startSequenceRef.current ||
        (startError instanceof DOMException && startError.name === "AbortError")
      ) {
        return;
      }

      setError(startError instanceof Error ? startError.message : String(startError));
      setCameraState("Camera stopped");
      setTrackingState("Tracker idle");
    }
  }, [ensureTrackerReady, stopSession]);

  useEffect(() => {
    void ensureTrackerReady().catch((trackerError) => {
      setError(
        trackerError instanceof Error ? trackerError.message : String(trackerError),
      );
    });
  }, [ensureTrackerReady]);

  useEffect(() => {
    return () => {
      stopSession();
      workerRef.current?.terminate();
      workerRef.current = undefined;
      trackerInitPromiseRef.current = undefined;
    };
  }, [stopSession]);

  const isCameraRunning = cameraState === "Camera running";
  const isCameraStarting = cameraState === "Requesting camera";

  return (
    <main className={debugVisible ? "app-shell debug-open" : "app-shell"}>
      {debugVisible && <FaceDebugPanel />}

      <section className="stage">
        <AvatarCanvas
          faceModelUrl={faceModelPath}
          onLoadStateChange={setAvatarState}
        />
      </section>

      <section className="control-rail" aria-label="Avatar driver controls">
        <div className="brand-block">
          <p>Avatar Driver</p>
          <h1>Realtime VRM facial driver</h1>
        </div>

        <div className="video-panel">
          <video ref={videoRef} className="camera-preview" />
          {landmarksVisible && (
            <LandmarkOverlay landmarks={latestFrame?.sourceFrame.landmarks} />
          )}
        </div>

        <div className="status-strip">
          <span>{cameraState}</span>
          <span>{trackingState}</span>
          <span>{avatarState}</span>
        </div>

        {error && <p className="error-banner">{error}</p>}

        <div className="control-row">
          <button
            type="button"
            onClick={() => {
              if (isCameraStarting) {
                stopSession();
                setCameraState("Camera idle");
                setTrackingState(
                  workerReadyRef.current ? "Tracker ready" : "Tracker idle",
                );
                return;
              }

              if (isCameraRunning) {
                stopSession();
                setCameraState("Camera idle");
                setTrackingState(
                  workerReadyRef.current ? "Tracker ready" : "Tracker idle",
                );
                return;
              }

              void start();
            }}
          >
            {isCameraRunning
              ? "Stop Camera"
              : isCameraStarting
                ? "Cancel"
                : "Start Camera"}
          </button>
          <label>
            <input
              type="checkbox"
              checked={debugVisible}
              onChange={(event) => setDebugVisible(event.target.checked)}
            />
            Debug
          </label>
          <label>
            <input
              type="checkbox"
              checked={landmarksVisible}
              onChange={(event) => setLandmarksVisible(event.target.checked)}
            />
            Landmarks
          </label>
          <a className="docs-link" href={docsPath}>
            Docs
          </a>
        </div>

        <p className="privacy-note">
          Webcam frames stay in the browser. Face inference runs locally and this
          demo does not collect, store, or transmit face data.
        </p>
      </section>
    </main>
  );
}
