// Haiku was unreliable at this prompt's multi-step tool-orchestration rules
// (turn counting, confirm-before-tool-call, then two sequential tool calls in
// order) -- observed both getting stuck re-asking the same question forever
// and skipping straight past submitQualification after createPatientAccount,
// silently stranding the patient in the chat view. Sonnet follows the same
// prompt reliably.
export const QUALIFICATION_MODEL_NAME = "claude-sonnet-5";
