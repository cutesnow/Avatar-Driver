export function normalizeBlendshapes(
  blendshapes: Record<string, number>,
): Record<string, number> {
  const normalized: Record<string, number> = {};

  for (const [name, score] of Object.entries(blendshapes)) {
    normalized[name] = clamp(score);
  }

  return normalized;
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}
