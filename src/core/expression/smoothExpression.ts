import { clamp } from "./normalizeBlendshapes";

export function smoothExpression(
  previous: Record<string, number> | undefined,
  next: Record<string, number>,
  factor: number,
) {
  if (!previous) {
    return next;
  }

  const smoothed: Record<string, number> = {};
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);

  for (const key of keys) {
    const oldValue = previous[key] ?? 0;
    const newValue = next[key] ?? 0;
    smoothed[key] = clamp(oldValue * factor + newValue * (1 - factor));
  }

  return smoothed;
}
