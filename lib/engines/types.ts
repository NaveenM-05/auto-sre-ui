export type EngineId =
  | "laptop1"
  | "debate"
  | "shadow"
  | "policy"
  | "execution"
  | "recovery"
  | "rl"
  | "impact";

export type EngineConnectionState =
  | "not_connected"
  | "unavailable"
  | "ready"
  | "degraded"
  | "running"
  | "blocked";

export interface EngineStatus {
  id: EngineId;
  name: string;
  status: EngineConnectionState;
  description: string;
}
