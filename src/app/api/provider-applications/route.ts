import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

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
    // No locale available yet -- form itself failed to parse.
    return NextResponse.json({ error: t("error_apply_form_required", "en") }, { status: 400 });
  }

  const localeField = text(formData, "locale");
  const locale: Locale = localeField === "en" ? "en" : "sw";

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

  if (!fullName || !email || !phone || !specialty || !licenseNumber) {
    return NextResponse.json({ error: t("error_apply_required_fields", locale) }, { status: 400 });
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
      return NextResponse.json({ error: t("error_apply_file_type", locale) }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: t("error_apply_file_too_large", locale) }, { status: 400 });
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
