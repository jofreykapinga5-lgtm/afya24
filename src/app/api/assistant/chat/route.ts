import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { buildQualificationSystemPrompt } from "@/lib/ai/system-prompt";
import { QUALIFICATION_MODEL_NAME } from "@/lib/ai/model";
import { createPatientAccountRecord } from "@/lib/patient-account";
import { createAccountClaimToken } from "@/lib/patient-session";
import { getPatientSession } from "@/lib/patient-session";
import { createServiceClient } from "@/lib/supabase/service";
import type { Locale } from "@/lib/types";

export const maxDuration = 30;

// No `execute` function on purpose -- this tool is a signal, not an action.
// The model calls it once it has enough to brief a doctor; the client reads
// the tool call's input directly (state "input-available") to switch from
// chat view to the qualification result view. Nothing here writes to the
// database; a real appointment/consultation record is created later in the
// booking flow, not by this chat.
const submitQualification = tool({
  description:
    "Call this only after the patient has confirmed the patient-facing summary, or immediately if the patient describes a medical emergency.",
  inputSchema: z.object({
    urgencyLevel: z.enum(["low", "moderate", "high", "emergency"]),
    recommendedSpecialties: z
      .array(z.string())
      .min(1)
      .describe("e.g. General Practice, Dermatology, Mental Health, Pediatrics"),
    patientConfirmedSummary: z
      .string()
      .describe(
        "Plain patient-facing summary that the patient confirmed or corrected before routing. Use the patient's language where possible."
      ),
    summaryForDoctor: z
      .string()
      .describe(
        "Structured clinical-style summary: chief complaint, duration, severity, relevant details the patient gave."
      ),
    missingInformation: z
      .array(z.string())
      .describe("Information the doctor may still want to ask about."),
    emergencyReason: z
      .string()
      .optional()
      .describe("If urgencyLevel is emergency, briefly explain the red flag."),
    chiefComplaint: z.string().optional().describe("Short label for the main concern."),
    symptoms: z.array(z.string()).optional().describe("Individual symptoms the patient mentioned."),
    duration: z.string().optional().describe("How long the patient has had these symptoms."),
    medications: z.array(z.string()).optional().describe("Medications the patient mentioned taking."),
    allergies: z.array(z.string()).optional().describe("Allergies the patient mentioned."),
    existingConditions: z
      .array(z.string())
      .optional()
      .describe("Existing/chronic conditions the patient mentioned."),
  }),
});

// This tool DOES need a real execute() -- it has to actually create the
// patient record. It deliberately does NOT set the session cookie itself:
// toUIMessageStreamResponse() below returns its Response before this
// execute() call resolves, so cookies().set() here would be unreliable
// (Next.js only supports setting cookies before a response starts
// streaming). Instead this returns a short-lived signed claim token; the
// client exchanges it for a real session cookie via a plain, non-streaming
// POST to /api/patient-session.
const createPatientAccount = tool({
  description:
    "Call this once, after the patient has confirmed their summary (skip entirely for emergencies), and once you have their full name, phone number, and date of birth. Creates their Afya24 file so a doctor can be reached.",
  inputSchema: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(7),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be normalized to YYYY-MM-DD before calling this tool."),
    preferredLanguage: z.enum(["en", "sw"]).optional(),
  }),
  execute: async ({ fullName, phone, dateOfBirth, preferredLanguage }) => {
    // Reuse an existing session if this browser already has one (e.g. the
    // patient restarted the chat within the same visit) instead of creating
    // a duplicate patients row.
    const existing = await getPatientSession();
    if (existing) {
      const service = createServiceClient();
      const { data } = await service
        .from("patients")
        .select("id")
        .eq("id", existing.patientId)
        .maybeSingle();
      if (data) {
        return {
          patientId: data.id as string,
          claimToken: await createAccountClaimToken(data.id as string),
        };
      }
    }

    const record = await createPatientAccountRecord({
      fullName,
      phone,
      dateOfBirth,
      preferredLanguage,
    });
    return { ...record, claimToken: await createAccountClaimToken(record.patientId) };
  },
});

export async function POST(request: Request) {
  const { messages, locale }: { messages: UIMessage[]; locale?: Locale } = await request.json();

  const result = streamText({
    model: anthropic(QUALIFICATION_MODEL_NAME),
    system: buildQualificationSystemPrompt(locale ?? "sw"),
    messages: await convertToModelMessages(messages),
    tools: { createPatientAccount, submitQualification },
    // Default stopWhen caps generation at 1 step. submitQualification has no
    // execute(), so it always naturally ends its step regardless of this cap
    // -- that's why the single-tool setup worked before. createPatientAccount
    // DOES have execute(); without raising this, the step where the model
    // calls it would produce no visible assistant text (filtered out
    // client-side) and the chat would look stalled.
    stopWhen: stepCountIs(2),
  });

  return result.toUIMessageStreamResponse();
}
