import { useEffect, useState } from "react";
import { expressionStore } from "../core/store/expressionStore";
import { BlendshapePanel } from "./BlendshapePanel";
import { PerformancePanel } from "./PerformancePanel";

export function FaceDebugPanel() {
  const [snapshot, setSnapshot] = useState(expressionStore.getState());

  useEffect(() => {
    const update = () => setSnapshot(expressionStore.getState());
    const unsubscribe = expressionStore.subscribe(update);
    const interval = window.setInterval(update, 120);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  const frame = snapshot.latestFrame;
  const rotation = frame?.headPose?.rotation;

  return (
    <aside className="debug-panel">
      <div className="debug-panel-heading">
        <h1>Debug</h1>
        <span className={frame?.sourceFrame.detected ? "status-on" : "status-off"}>
          face detected: {String(frame?.sourceFrame.detected ?? false)}
        </span>
      </div>

      <PerformancePanel fps={snapshot.fps} latencyMs={snapshot.latencyMs} />

      <div className="debug-section">
        <h2>Avatar</h2>
        <dl className="debug-list">
          <div>
            <dt>Expression</dt>
            <dd>{frame?.dominantExpression ?? "neutral"}</dd>
          </div>
          <div>
            <dt>Mapping</dt>
            <dd>{snapshot.mappingProfile}</dd>
          </div>
          <div>
            <dt>Head X/Y/Z</dt>
            <dd>
              {rotation
                ? `${rotation.x.toFixed(2)} / ${rotation.y.toFixed(
                    2,
                  )} / ${rotation.z.toFixed(2)}`
                : "0.00 / 0.00 / 0.00"}
            </dd>
          </div>
          <div>
            <dt>Mesh</dt>
            <dd>{snapshot.meshDiagnostics.reason}</dd>
          </div>
          <div>
            <dt>Mesh updates / vertices / landmarks</dt>
            <dd>
              {snapshot.meshDiagnostics.updateCount} /{" "}
              {snapshot.meshDiagnostics.positionCount} /{" "}
              {snapshot.meshDiagnostics.landmarkCount}
            </dd>
          </div>
        </dl>
      </div>

      <div className="debug-section">
        <h2>Tracking</h2>
        <dl className="debug-list">
          <div>
            <dt>Video</dt>
            <dd>
              {snapshot.diagnostics.videoWidth} x{" "}
              {snapshot.diagnostics.videoHeight}
            </dd>
          </div>
          <div>
            <dt>Worker</dt>
            <dd>{snapshot.diagnostics.workerReady ? "ready" : "not ready"}</dd>
          </div>
          <div>
            <dt>Frames sent / received / detected</dt>
            <dd>
              {snapshot.diagnostics.framesSent} /{" "}
              {snapshot.diagnostics.framesReceived} /{" "}
              {snapshot.diagnostics.facesDetected}
            </dd>
          </div>
          {snapshot.diagnostics.lastWorkerError && (
            <div>
              <dt>Worker error</dt>
              <dd>{snapshot.diagnostics.lastWorkerError}</dd>
            </div>
          )}
        </dl>
      </div>

      <BlendshapePanel blendshapes={frame?.blendshapes ?? {}} />
    </aside>
  );
}
