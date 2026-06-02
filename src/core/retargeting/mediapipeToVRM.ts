import type { MappingConfig } from "../expression/expressionTypes";
import { clamp } from "../expression/normalizeBlendshapes";

export function applyMapping(
  blendshapes: Record<string, number>,
  mappings: MappingConfig["mappings"],
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [targetExpression, rules] of Object.entries(mappings)) {
    const value = rules.reduce((sum, rule) => {
      return sum + (blendshapes[rule.input] ?? 0) * rule.weight;
    }, 0);

    result[targetExpression] = clamp(value);
  }

  return result;
}

export function getDominantExpression(expressions: Record<string, number>) {
  let dominant = "neutral";
  let score = 0;

  for (const [name, value] of Object.entries(expressions)) {
    if (name.startsWith("blink")) {
      continue;
    }

    if (value > score) {
      dominant = name;
      score = value;
    }
  }

  return score > 0.2 ? dominant : "neutral";
}
