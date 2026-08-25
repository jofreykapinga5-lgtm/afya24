"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  FileAudio,
  FileText,
  HeartPulse,
  ImageIcon,
  MessageCircle,
  Mic,
  Paperclip,
  Send,
  ShieldCheck,
  Square,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DobSelect } from "@/app/lookup/dob-select";
import { createPatientAccountFallback } from "./actions";
import { useAppStore } from "@/lib/store";
import { t, type TranslationKey } from "@/lib/i18n";
import type { QualificationResult, UrgencyLevel } from "@/lib/types";

interface AccountResult {
  patientId: string;
  claimToken: string;
}

interface PatientDraft {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  preferredLanguage?: string;
}

type AttachmentKind = "image" | "pdf" | "audio";

interface IntakeAttachment {
  id: string;
  name: string;
  kind: AttachmentKind;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  file: File;
  uploadStatus: "local" | "uploading" | "stored" | "failed";
  uploadedFileId?: string;
  storagePath?: string;
}

const urgencyStyles: Record<UrgencyLevel, string> = {
  low: "bg-primary-soft text-accent-foreground border-primary/30",
  moderate: "bg-pending-soft text-pending border-pending/30",
  high: "bg-urgent-soft text-urgent border-urgent/30",
  emergency: "bg-urgent-soft text-urgent border-urgent/30",
};

const urgencyLabelKeys: Record<UrgencyLevel, TranslationKey> = {
  low: "urgency_low_label",
  moderate: "urgency_moderate_label",
  high: "urgency_high_label",
  emergency: "urgency_emergency_label",
};

const maxAttachmentBytes = 12 * 1024 * 1024;

function sanitizePatientAiText(text: string) {
  return text
    .replace(/[*★☆#`_>~]/g, "")
    .replace(/^[\s•-]+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function attachmentKind(file: File): AttachmentKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function QualificationPage() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const initialComplaint = useAppStore((state) => state.qualificationComplaint);
  const setQualificationResult = useAppStore((state) => state.setQualificationResult);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<IntakeAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const seededRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<IntakeAttachment[]>([]);
  const uploadingAttachmentIdsRef = useRef<Set<string>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const [chatError, setChatError] = useState<string | null>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/assistant/chat",
      body: { locale },
    }),
    onError: () => {
      setChatError(t("qualification_chat_error", locale));
    },
  });

  useEffect(() => {
    if (!seededRef.current && initialComplaint.trim()) {
      seededRef.current = true;
      sendMessage({ text: initialComplaint });
    }
  }, [initialComplaint, sendMessage]);

  const result = useMemo<QualificationResult | null>(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type === "tool-submitQualification" && part.state === "input-available") {
          return part.input as QualificationResult;
        }
      }
    }
    return null;
  }, [messages]);

  const toolAccountResult = useMemo<AccountResult | null>(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        // The tool can also resolve to { status: "phone_already_registered" }
        // (no patientId/claimToken) when the phone number already belongs to
        // an existing patient file -- the model handles that conversationally
        // in chat text, so this guard keeps that non-result from being
        // treated as a real account (which would fire the session-claim
        // fetch below with an undefined claimToken).
        if (
          part.type === "tool-createPatientAccount" &&
          part.state === "output-available" &&
          part.output &&
          typeof part.output === "object" &&
          "patientId" in part.output
        ) {
          return part.output as AccountResult;
        }
      }
    }
    return null;
  }, [messages]);

  // Once account creation succeeds -- either via the AI tool or the fallback
  // form below -- both paths converge on the same UI state through this.
  const [fallbackAccountResult, setFallbackAccountResult] = useState<{
    patientId: string;
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
  } | null>(null);
  const accountResult = toolAccountResult ?? fallbackAccountResult;

  const patientDraft = useMemo<PatientDraft>(() => {
    let draft: PatientDraft = {};
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type !== "tool-createPatientAccount") continue;
        const input = "input" in part ? (part.input as Partial<PatientDraft> | undefined) : undefined;
        if (input) {
          draft = {
            ...draft,
            fullName: input.fullName ?? draft.fullName,
            phone: input.phone ?? draft.phone,
            dateOfBirth: input.dateOfBirth ?? draft.dateOfBirth,
            preferredLanguage: input.preferredLanguage ?? draft.preferredLanguage,
          };
        }
      }
    }

    return {
      ...draft,
      ...(fallbackAccountResult ?? {}),
    };
  }, [fallbackAccountResult, messages]);

  const [sessionEstablished, setSessionEstablished] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const sessionRequestSentRef = useRef(false);

  useEffect(() => {
    if (!toolAccountResult || sessionRequestSentRef.current) return;
    sessionRequestSentRef.current = true;

    fetch("/api/patient-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimToken: toolAccountResult.claimToken }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("session_failed");
        setSessionEstablished(true);
      })
      .catch(() => {
        setSessionError(t("qualification_session_error", locale));
      });
  }, [toolAccountResult, locale]);

  useEffect(() => {
    if (result) setQualificationResult(result);
  }, [result, setQualificationResult]);

  // Recovery path: if the AI never calls createPatientAccount (model
  // reliability isn't perfect), surface a small manual form after a short
  // wait instead of leaving the patient stuck with a disabled CTA forever.
  const [showFallbackForm, setShowFallbackForm] = useState(false);
  useEffect(() => {
    if (!result || accountResult) return;
    const id = setTimeout(() => setShowFallbackForm(true), 6000);
    return () => clearTimeout(id);
  }, [result, accountResult]);

  const [fallbackPending, startFallbackTransition] = useTransition();
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  function handleFallbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();

    if (!fullName || !phone || !dateOfBirth) {
      setFallbackError(t("qualification_fallback_error", locale));
      return;
    }

    setFallbackError(null);
    startFallbackTransition(async () => {
      const result = await createPatientAccountFallback({
        fullName,
        phone,
        dateOfBirth,
        preferredLanguage: locale,
      });
      if (result.ok) {
        setFallbackAccountResult({
          patientId: result.patientId,
          fullName,
          phone,
          dateOfBirth,
        });
        setSessionEstablished(true);
      } else {
        setFallbackError(result.message || t("qualification_fallback_error", locale));
      }
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    setChatError(null);
    sendMessage({ text: input });
    setInput("");
  }

  function addFiles(files: FileList | File[]) {
    const nextAttachments: IntakeAttachment[] = [];
    setAttachmentError(null);

    Array.from(files).forEach((file) => {
      const kind = attachmentKind(file);
      if (!kind) {
        setAttachmentError("Only images, PDFs, and voice notes are supported.");
        return;
      }
      if (file.size > maxAttachmentBytes) {
        setAttachmentError("Keep each file under 12 MB so the chat stays fast.");
        return;
      }

      nextAttachments.push({
        id: `attachment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: file.name,
        kind,
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        file,
        uploadStatus: "local",
      });
    });

    if (nextAttachments.length > 0) {
      setAttachments((current) => {
        const combined = [...current, ...nextAttachments];
        const trimmed = combined.slice(-8);
        combined.slice(0, Math.max(0, combined.length - 8)).forEach((attachment) => {
          URL.revokeObjectURL(attachment.url);
        });
        return trimmed;
      });
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const removed = current.find((attachment) => attachment.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((attachment) => attachment.id !== id);
    });
  }

  async function uploadAttachment(attachment: IntakeAttachment) {
    uploadingAttachmentIdsRef.current.add(attachment.id);
    setAttachments((current) =>
      current.map((item) =>
        item.id === attachment.id ? { ...item, uploadStatus: "uploading" } : item
      )
    );

    const body = new FormData();
    body.append("file", attachment.file);

    try {
      const response = await fetch("/api/patient-attachments", {
        method: "POST",
        body,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Upload failed.");
      }

      setAttachments((current) =>
        current.map((item) =>
          item.id === attachment.id
            ? {
                ...item,
                uploadStatus: "stored",
                uploadedFileId: payload.file?.id,
                storagePath: payload.file?.storage_path,
              }
            : item
        )
      );
    } catch {
      setAttachments((current) =>
        current.map((item) =>
          item.id === attachment.id ? { ...item, uploadStatus: "failed" } : item
        )
      );
    } finally {
      uploadingAttachmentIdsRef.current.delete(attachment.id);
    }
  }

  async function startVoiceNote() {
    setAttachmentError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setAttachmentError("Voice recording is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: mimeType });
          addFiles([file]);
        }
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordingChunksRef.current = [];
        setIsRecording(false);
      });

      recorder.start();
      setIsRecording(true);
    } catch {
      setAttachmentError("Microphone permission was not granted.");
    }
  }

  function stopVoiceNote() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => URL.revokeObjectURL(attachment.url));
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    if (!sessionEstablished) return;
    attachments.forEach((attachment) => {
      if (
        attachment.uploadStatus === "local" &&
        !uploadingAttachmentIdsRef.current.has(attachment.id)
      ) {
        void uploadAttachment(attachment);
      }
    });
  }, [attachments, sessionEstablished]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  if (result) {
    const isEmergency = result.urgencyLevel === "emergency";

    return (
      <main className="flex-1 bg-[#f8fbfa] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[330px_1fr]">
          <PatientIntakeCard patient={patientDraft} locale={locale} />

          <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_22px_60px_-42px_rgba(8,50,115,0.55)] ring-1 ring-[#dfe8eb]">
            <div className="border-b border-[#e1e9ec] bg-[#f4faf9] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a7b]">
                {t("qualification_ai_summary_label", locale)}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#071923]">
                {t("qualification_result_title", locale)}
              </h1>
            </div>

            <div className="grid gap-4 p-5">
              <div
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${urgencyStyles[result.urgencyLevel]}`}
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-semibold">{t(urgencyLabelKeys[result.urgencyLevel], locale)}</p>
                  {isEmergency && result.emergencyReason ? (
                    <p className="mt-0.5 opacity-90">{result.emergencyReason}</p>
                  ) : (
                    <p className="mt-0.5 opacity-90">
                      {t("qualification_recommended_specialty", locale)}:{" "}
                      {result.recommendedSpecialties.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {isEmergency && (
                <div className="rounded-2xl border border-urgent/30 bg-urgent-soft px-4 py-3 text-sm text-urgent">
                  <p className="font-semibold">{t("qualification_not_emergency_title", locale)}</p>
                  <p className="mt-0.5 opacity-90">{t("qualification_not_emergency_body", locale)}</p>
                </div>
              )}

              <ClinicalSnapshot result={result} locale={locale} />

              <AttachmentsSummary attachments={attachments} />

              <SummaryCard
                icon={ClipboardList}
                title={t("qualification_patient_summary_label", locale)}
                body={result.patientConfirmedSummary}
              />

              <SummaryCard
                icon={FileText}
                title={t("qualification_doctor_summary_label", locale)}
                body={result.summaryForDoctor}
              />

              {result.missingInformation.length > 0 && (
                <div className="rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
                  <p className="text-sm font-bold text-[#071923]">
                    {t("qualification_missing_info_label", locale)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.missingInformation.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#60717a] ring-1 ring-[#dfe8eb]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!isEmergency && (
                <div className="grid gap-3">
                  {!accountResult && !showFallbackForm && (
                    <p className="rounded-2xl bg-[#f4faf9] px-4 py-3 text-center text-sm font-medium text-[#60717a]">
                      {t("qualification_setting_up_account", locale)}
                    </p>
                  )}

                  {sessionError && !accountResult && (
                    <p className="rounded-2xl bg-urgent-soft px-4 py-3 text-center text-sm font-medium text-urgent">
                      {sessionError}
                    </p>
                  )}

                  {!accountResult && showFallbackForm && (
                    <FallbackDetailsForm
                      locale={locale}
                      fallbackError={fallbackError}
                      fallbackPending={fallbackPending}
                      onSubmit={handleFallbackSubmit}
                    />
                  )}

                  <Button
                    size="lg"
                    className="h-12 w-full gap-2 rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]"
                    disabled={!sessionEstablished}
                    onClick={() =>
                      router.push(
                        `/doctors?specialty=${encodeURIComponent(result.recommendedSpecialties[0])}`
                      )
                    }
                  >
                    {t("qualification_view_doctors_cta", locale)}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              )}

              <Link
                href="/"
                className="justify-self-center text-sm font-medium text-[#60717a] underline-offset-4 hover:text-[#083273] hover:underline"
              >
                {t("qualification_start_over", locale)}
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-x-0 bottom-0 top-14 z-0 overflow-hidden bg-[#f8fbfa] px-3 py-3 sm:px-5">
      <div className="mx-auto h-full w-full max-w-3xl">
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_22px_60px_-44px_rgba(8,50,115,0.55)] ring-1 ring-[#dfe8eb]">
          <div className="flex shrink-0 items-center gap-3 border-b border-[#e1e9ec] bg-[#f4faf9] px-4 py-3 sm:px-5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f7f4] text-[#087a7b]">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#071923]">{t("qualification_ai_name", locale)}</p>
              <p className="text-xs text-[#60717a]">
                {t("qualification_ai_subtitle", locale)}
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
            {messages.map((message) => {
              const text = message.parts
                .map((part) => (part.type === "text" ? part.text : ""))
                .join("");
              if (!text) return null;
              const visibleText = message.role === "assistant" ? sanitizePatientAiText(text) : text;

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-[0_12px_28px_-24px_rgba(8,50,115,0.55)] ${
                      message.role === "user"
                        ? "bg-[#083273] text-white"
                        : "bg-[#f4f6f6] text-[#071923]"
                    }`}
                  >
                    {visibleText}
                  </div>
                </div>
              );
            })}

            {(status === "submitted" || status === "streaming") && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-[#f4f6f6] px-4 py-3 text-sm text-[#60717a]">
                  {t("qualification_typing", locale)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-[#e1e9ec] bg-white px-4 py-3 sm:px-5"
          >
            {attachments.length > 0 ? (
              <AttachmentStrip attachments={attachments} onRemove={removeAttachment} />
            ) : null}
            {attachmentError ? (
              <p className="mb-2 rounded-xl bg-urgent-soft px-3 py-2 text-xs font-medium text-urgent">
                {attachmentError}
              </p>
            ) : null}
            {chatError ? (
              <p className="mb-2 rounded-xl bg-urgent-soft px-3 py-2 text-xs font-medium text-urgent">
                {chatError}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,audio/webm,audio/mpeg,audio/mp4,audio/m4a,audio/x-m4a,audio/wav"
                multiple
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files) addFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t("qualification_input_placeholder", locale)}
                disabled={status === "streaming" || status === "submitted"}
                className="h-12 min-w-0 flex-1 rounded-full border border-[#d8e5e3] bg-[#f8fbfa] px-4 text-sm text-[#071923] outline-none placeholder:text-[#77858b] focus-visible:border-[#01b7bb] focus-visible:ring-3 focus-visible:ring-[#01b7bb]/20"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-12 shrink-0 rounded-full bg-[#f8fbfa]"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image, PDF, or audio"
              >
                <Paperclip className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                className="size-12 shrink-0 rounded-full bg-[#f8fbfa]"
                onClick={isRecording ? stopVoiceNote : startVoiceNote}
                aria-label={isRecording ? "Stop voice note" : "Record voice note"}
              >
                {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || status === "streaming" || status === "submitted"}
                className="size-12 shrink-0 rounded-full bg-[#01b7bb] text-white hover:bg-[#019ea2]"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function PatientIntakeCard({
  patient,
  locale,
  compact = false,
}: {
  patient: PatientDraft;
  locale: "en" | "sw";
  compact?: boolean;
}) {
  const fileReady = Boolean(patient.fullName && patient.phone && patient.dateOfBirth);
  const initials = patient.fullName
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <section className={compact ? "flex h-full flex-col" : "rounded-[1.5rem] bg-white p-5 shadow-[0_22px_60px_-42px_rgba(8,50,115,0.55)] ring-1 ring-[#dfe8eb]"}>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7f4] text-[#087a7b]">
          {initials ? <span className="text-sm font-bold">{initials}</span> : <UserRound className="size-6" />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a7b]">
            {locale === "sw" ? "Faili ya mgonjwa" : "Patient file"}
          </p>
          <h2 className="truncate text-lg font-bold tracking-tight text-[#071923]">
            {patient.fullName || (locale === "sw" ? "Maelezo ya mgonjwa" : "Patient details")}
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <PatientField label={locale === "sw" ? "Simu" : "Phone"} value={patient.phone} locale={locale} />
        <PatientField label={locale === "sw" ? "Tarehe ya kuzaliwa" : "Date of birth"} value={patient.dateOfBirth} locale={locale} />
      </div>

      <div className="mt-5 rounded-2xl bg-[#f4faf9] p-4 ring-1 ring-[#dfe8eb]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-[#087a7b]" />
          <p className="text-sm font-bold text-[#071923]">
            {fileReady
              ? locale === "sw"
                ? "Faili imeandaliwa"
                : "File ready"
              : locale === "sw"
                ? "Tunakusanya maelezo"
                : "Collecting details"}
          </p>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#60717a]">
          {locale === "sw"
            ? "Afya24 itaonyesha muhtasari kwanza ili mgonjwa athibitishe kabla ya kupelekwa kwa daktari."
            : "Afya24 shows the summary first so the patient can confirm before doctor routing."}
        </p>
      </div>

      {compact ? <div className="flex-1" /> : null}
    </section>
  );
}

function PatientField({
  label,
  value,
  locale,
  mono,
}: {
  label: string;
  value?: string;
  locale: "en" | "sw";
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-[#f8fbfd] px-4 py-3 ring-1 ring-[#dfe8eb]">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7a82]">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-[#071923] ${mono ? "font-mono" : ""}`}>
        {value || (locale === "sw" ? "Inasubiri uthibitisho" : "Pending confirmation")}
      </p>
    </div>
  );
}

function ClinicalSnapshot({
  result,
  locale,
}: {
  result: QualificationResult;
  locale: "en" | "sw";
}) {
  const rows = [
    {
      label: locale === "sw" ? "Tatizo kuu" : "Chief concern",
      value: result.chiefComplaint,
    },
    {
      label: locale === "sw" ? "Muda" : "Duration",
      value: result.duration,
    },
    {
      label: locale === "sw" ? "Dalili" : "Symptoms",
      value: result.symptoms?.join(", "),
    },
    {
      label: locale === "sw" ? "Dawa alizotaja" : "Medication mentioned",
      value: result.medications?.join(", "),
    },
    {
      label: locale === "sw" ? "Mzio" : "Allergies",
      value: result.allergies?.join(", "),
    },
    {
      label: locale === "sw" ? "Hali zilizopo" : "Existing conditions",
      value: result.existingConditions?.join(", "),
    },
  ].filter((row) => row.value);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl bg-[#f4faf9] p-4 ring-1 ring-[#dfe8eb]">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#087a7b] ring-1 ring-[#dfe8eb]">
          <Stethoscope className="size-4" />
        </span>
        <p className="text-sm font-bold text-[#071923]">
          {locale === "sw" ? "Muhtasari wa kesi" : "Case snapshot"}
        </p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#dfe8eb]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7a82]">
              {row.label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-5 text-[#071923]">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#e8f7f4] text-[#087a7b]">
          <Icon className="size-4" />
        </span>
        <p className="text-sm font-bold text-[#071923]">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#405058]">{body}</p>
    </article>
  );
}

function AttachmentIcon({ kind }: { kind: AttachmentKind }) {
  if (kind === "image") return <ImageIcon className="size-4" />;
  if (kind === "audio") return <FileAudio className="size-4" />;
  return <FileText className="size-4" />;
}

function uploadStatusLabel(status: IntakeAttachment["uploadStatus"]) {
  if (status === "stored") return "Stored";
  if (status === "uploading") return "Saving";
  if (status === "failed") return "Retry needed";
  return "Ready";
}

function uploadStatusClass(status: IntakeAttachment["uploadStatus"]) {
  if (status === "stored") return "bg-[#e8f7f4] text-[#087a7b]";
  if (status === "uploading") return "bg-info-soft text-info";
  if (status === "failed") return "bg-urgent-soft text-urgent";
  return "bg-[#eef3f5] text-[#60717a]";
}

function AttachmentStrip({
  attachments,
  onRemove,
}: {
  attachments: IntakeAttachment[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="group relative flex min-w-48 items-center gap-2 rounded-2xl bg-[#f8fbfd] p-2 pr-8 ring-1 ring-[#dfe8eb]"
        >
          {attachment.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachment.url}
              alt=""
              className="size-10 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f4] text-[#087a7b]">
              <AttachmentIcon kind={attachment.kind} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[#071923]">{attachment.name}</p>
            <p className="text-[11px] text-[#60717a]">
              {formatBytes(attachment.size)} / {uploadStatusLabel(attachment.uploadStatus)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-white text-[#60717a] shadow-sm ring-1 ring-[#dfe8eb] hover:text-urgent"
            aria-label={`Remove ${attachment.name}`}
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function AttachmentsSummary({ attachments }: { attachments: IntakeAttachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <section className="rounded-2xl bg-[#f4faf9] p-4 ring-1 ring-[#dfe8eb]">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#087a7b] ring-1 ring-[#dfe8eb]">
          <Paperclip className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#071923]">Patient attachments</p>
          <p className="text-xs text-[#60717a]">Images, PDFs, and voice notes collected during intake.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {attachments.map((attachment) => (
          <article key={attachment.id} className="rounded-2xl bg-white p-3 ring-1 ring-[#dfe8eb]">
            <div className="flex gap-3">
              {attachment.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="size-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f4] text-[#087a7b]">
                  <AttachmentIcon kind={attachment.kind} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#071923]">{attachment.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs capitalize text-[#60717a]">
                    {attachment.kind} / {formatBytes(attachment.size)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${uploadStatusClass(attachment.uploadStatus)}`}>
                    {uploadStatusLabel(attachment.uploadStatus)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#60717a]">Added {attachment.createdAt}</p>
                {attachment.storagePath ? (
                  <p className="mt-1 truncate font-mono text-[10px] text-[#87949b]">
                    {attachment.storagePath}
                  </p>
                ) : null}
              </div>
            </div>
            {attachment.kind === "audio" ? (
              <audio src={attachment.url} controls className="mt-3 w-full" />
            ) : null}
            {attachment.kind === "pdf" ? (
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-full bg-[#083273] px-3 py-1.5 text-xs font-bold text-white"
              >
                Open PDF
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function FallbackDetailsForm({
  locale,
  fallbackError,
  fallbackPending,
  onSubmit,
}: {
  locale: "en" | "sw";
  fallbackError: string | null;
  fallbackPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
      <div className="flex items-center gap-2">
        <HeartPulse className="size-4 text-[#087a7b]" />
        <p className="text-sm font-bold text-[#071923]">
          {t("qualification_fallback_title", locale)}
        </p>
      </div>
      <p className="mt-1 text-sm text-[#60717a]">
        {t("qualification_fallback_body", locale)}
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="fallbackFullName" className="text-sm font-medium">
            {t("qualification_fallback_name_label", locale)}
          </label>
          <Input id="fallbackFullName" name="fullName" required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="fallbackPhone" className="text-sm font-medium">
            {t("qualification_fallback_phone_label", locale)}
          </label>
          <Input id="fallbackPhone" name="phone" type="tel" required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">{t("lookup_dob_label", locale)}</span>
          <DobSelect locale={locale} />
        </div>
        {fallbackError && <p className="text-sm text-urgent sm:col-span-2">{fallbackError}</p>}
        <Button type="submit" disabled={fallbackPending} className="h-11 rounded-full sm:col-span-2">
          {t("qualification_fallback_submit", locale)}
        </Button>
      </form>
    </div>
  );
}
