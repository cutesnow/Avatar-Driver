type PerformancePanelProps = {
  fps: number;
  latencyMs: number;
};

export function PerformancePanel({ fps, latencyMs }: PerformancePanelProps) {
  return (
    <div className="debug-grid">
      <div>
        <span>FPS</span>
        <strong>{fps.toFixed(0)}</strong>
      </div>
      <div>
        <span>Latency</span>
        <strong>{latencyMs.toFixed(1)}ms</strong>
      </div>
    </div>
  );
}
