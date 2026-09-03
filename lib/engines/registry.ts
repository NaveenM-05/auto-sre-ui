import { EngineId, EngineStatus } from "./types";

export const STATIC_ENGINE_REGISTRY: Record<
  Exclude<EngineId, "laptop1">,
  EngineStatus
> = {
  debate: {
    id: "debate",
    name: "Debate",
    status: "not_connected",
    description: "Diagnosis / hypotheses / diagnosis confidence / consensus",
  },
  shadow: {
    id: "shadow",
    name: "Shadow",
    status: "not_connected",
    description: "Sandbox validation",
  },
  policy: {
    id: "policy",
    name: "Policy",
    status: "not_connected",
    description: "Authorization / veto",
  },
  execution: {
    id: "execution",
    name: "Execution",
    status: "not_connected",
    description: "Action execution",
  },
  recovery: {
    id: "recovery",
    name: "Recovery Verification",
    status: "not_connected",
    description: "Post-action verification / rollback state",
  },
  rl: {
    id: "rl",
    name: "RL",
    status: "not_connected",
    description: "Learned policy recommendations",
  },
  impact: {
    id: "impact",
    name: "Business Impact",
    status: "not_connected",
    description: "Business impact / ROI",
  },
};
