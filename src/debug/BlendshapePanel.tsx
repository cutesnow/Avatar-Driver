type BlendshapePanelProps = {
  blendshapes: Record<string, number>;
};

const blendshapeNames = [
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "mouthSmileLeft",
  "mouthSmileRight",
  "jawOpen",
  "browInnerUp",
  "browDownLeft",
  "browDownRight",
  "mouthFrownLeft",
  "mouthFrownRight",
];

export function BlendshapePanel({ blendshapes }: BlendshapePanelProps) {
  return (
    <div className="debug-section">
      <h2>Blendshapes</h2>
      <div className="meter-list">
        {blendshapeNames.map((name) => (
          <label className="meter-row" key={name}>
            <span>{name}</span>
            <progress value={blendshapes[name] ?? 0} max="1" />
            <strong>{((blendshapes[name] ?? 0) * 100).toFixed(0)}%</strong>
          </label>
        ))}
      </div>
    </div>
  );
}
