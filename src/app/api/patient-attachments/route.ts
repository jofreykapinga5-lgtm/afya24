import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPatientSession } from "@/lib/patient-session";

const BUCKET = "patient-attachments";
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "audio/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/wav",
];

function attachmentKind(file: File) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return file.type.split("/")[1] || "jpg";
  if (file.type.startsWith("audio/")) return "webm";
  return "bin";
}

function normalizedMimeType(file: File) {
  if (file.type.startsWith("audio/webm")) return "audio/webm";
  if (file.type.startsWith("audio/mp4")) return "audio/mp4";
  if (file.type.startsWith("audio/mpeg")) return "audio/mpeg";
  if (file.type.startsWith("audio/wav")) return "audio/wav";
  return file.type || "application/octet-stream";
}

function isMissingColumnError(message: string) {
  return ["mime_type", "size_bytes", "attachment_kind"].some((column) => message.includes(column));
}

export async function POST(request: Request) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ error: "Patient session is required." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  const kind = attachmentKind(file);
  if (!kind) {
    return NextResponse.json({ error: "Only images, PDFs, and audio are supported." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be 12 MB or smaller." }, { status: 400 });
  }

  const service = createServiceClient();
  const extension = extensionFor(file);
  const mimeType = normalizedMimeType(file);
  const storagePath = `${session.patientId}/${crypto.randomUUID()}.${extension}`;
  const bytes = await file.arrayBuffer();

  const { error: bucketError } = await service.storage.getBucket(BUCKET);
  if (bucketError) {
    const { error: createBucketError } = await service.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });
    if (createBucketError && !createBucketError.message.toLowerCase().includes("already exists")) {
      return NextResponse.json({ error: createBucketError.message }, { status: 500 });
    }
  }

  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const baseFileRecord = {
    patient_id: session.patientId,
    file_type: kind,
    storage_path: storagePath,
    original_filename: file.name,
  };

  const richFileRecord = {
    ...baseFileRecord,
    attachment_kind: kind,
    mime_type: mimeType,
    size_bytes: file.size,
  };

  const { data, error: insertError } = await service
    .from("files")
    .insert(richFileRecord)
    .select("id, storage_path, original_filename, file_type, attachment_kind, mime_type, size_bytes, created_at")
    .single();

  if (insertError && isMissingColumnError(insertError.message)) {
    const { data: fallbackData, error: fallbackError } = await service
      .from("files")
      .insert(baseFileRecord)
      .select("id, storage_path, original_filename, file_type, created_at")
      .single();

    if (!fallbackError) {
      return NextResponse.json({
        file: {
          ...fallbackData,
          attachment_kind: kind,
          mime_type: mimeType,
          size_bytes: file.size,
        },
      });
    }
  }

  if (insertError) {
    await service.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ file: data });
}
