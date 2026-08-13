import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const BUCKET = "provider-applications";
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Application form is required." }, { status: 400 });
  }

  const fullName = text(formData, "fullName");
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "phone");
  const licenseNumber = text(formData, "licenseNumber");
  const specialty = text(formData, "specialty");
  const region = text(formData, "region");
  const experienceYearsRaw = text(formData, "experienceYears");
  const bio = text(formData, "bio");
  const languages = formData.getAll("languages").map(String).filter(Boolean);
  const consultationModes = formData.getAll("consultationModes").map(String).filter(Boolean);
  const file = formData.get("file");

  if (!fullName || !email || !specialty || !licenseNumber) {
    return NextResponse.json(
      { error: "Full name, email, license number, and specialty are required." },
      { status: 400 }
    );
  }

  const service = createServiceClient();
  let filePayload: {
    file_path?: string;
    file_name?: string;
    file_mime_type?: string;
    file_size_bytes?: number;
  } = {};

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Upload a JPG, PNG, WebP, or PDF file." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be 12 MB or smaller." }, { status: 400 });
    }

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

    const path = `${crypto.randomUUID()}/${crypto.randomUUID()}.${extensionFor(file)}`;
    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await service.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    filePayload = {
      file_path: path,
      file_name: file.name,
      file_mime_type: file.type,
      file_size_bytes: file.size,
    };
  }

  const { data, error } = await service
    .from("provider_applications")
    .insert({
      full_name: fullName,
      email,
      phone: phone || null,
      license_number: licenseNumber,
      specialty,
      region: region || null,
      experience_years: experienceYearsRaw ? Number(experienceYearsRaw) : null,
      languages,
      consultation_modes: consultationModes,
      bio: bio || null,
      ...filePayload,
    })
    .select("id")
    .single();

  if (error) {
    if (filePayload.file_path) {
      await service.storage.from(BUCKET).remove([filePayload.file_path]);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
