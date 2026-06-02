import type { MappingConfig } from "../expression/expressionTypes";

export async function loadMappingConfig(path: string): Promise<MappingConfig> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load mapping profile: ${response.status}`);
  }

  return response.json() as Promise<MappingConfig>;
}
