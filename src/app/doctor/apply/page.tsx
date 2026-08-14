"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  File as FileIcon,
  FileUp,
  ShieldCheck,
  X,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_FILE_BYTES = 12 * 1024 * 1024;

export default function DoctorApplicationPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/provider-applications", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not submit application.");
        return;
      }
      setSuccess(true);
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_BYTES) {
      setError("File must be 12 MB or smaller.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }

  function clearFile() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <main className="min-h-[100dvh] bg-[#f7fbfb] px-4 py-6 text-[#071923] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/brand/afya24-logo-header.png"
            alt="Afya24"
            width={220}
            height={70}
            priority
            style={{ width: "auto" }}
            className="h-8"
          />
        </Link>

        <div className="mx-auto mt-8 max-w-2xl">
          <h1 className="text-center text-2xl font-bold sm:text-3xl">Doctor application</h1>

          <Reveal delay={60}>
            <section className="mt-6 rounded-[1.75rem] bg-white p-5 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#dfe8eb] sm:p-7">
              {success ? (
                <div className="grid min-h-[32rem] place-items-center text-center">
                  <div>
                    <CheckCircle2 className="mx-auto size-12 text-[#01b7bb]" />
                    <h2 className="mt-4 text-2xl font-bold">Application submitted</h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#60717a]">
                      The Afya24 team will review your details and contact you with the next step.
                    </p>
                    <Button className="mt-5 rounded-full" nativeButton={false} render={<Link href="/" />}>
                      Back home
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitApplication} className="grid gap-7" noValidate>
                  <FormSection title="Personal details">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Full name" required>
                        <Input name="fullName" required placeholder="Dr. Amina Hassan" />
                      </Field>
                      <Field label="Email" required>
                        <Input name="email" type="email" required placeholder="doctor@email.com" />
                      </Field>
                      <Field label="Phone">
                        <Input name="phone" placeholder="+255..." />
                      </Field>
                      <Field label="Region">
                        <Input name="region" placeholder="Dar es Salaam" />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection title="Professional credentials">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="License number" required>
                        <Input name="licenseNumber" required placeholder="Medical council number" />
                      </Field>
                      <Field label="Specialty" required>
                        <Input name="specialty" required placeholder="General practice" />
                      </Field>
                      <Field label="Years of experience">
                        <Input name="experienceYears" type="number" min="0" max="70" placeholder="5" />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection title="Languages">
                    <fieldset className="rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
                      <legend className="px-1 text-sm font-bold">Languages</legend>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        <Check name="languages" value="sw" label="Swahili" />
                        <Check name="languages" value="en" label="English" />
                      </div>
                    </fieldset>
                  </FormSection>

                  <FormSection title="About you">
                    <Field label="Short bio">
                      <Textarea
                        name="bio"
                        placeholder="Tell us what you specialize in and how you support patients."
                        className="min-h-24"
                      />
                    </Field>
                  </FormSection>

                  <FormSection title="Supporting document">
                    <label
                      htmlFor="doctor-application-file"
                      className="group grid cursor-pointer gap-3 rounded-2xl border-2 border-dashed border-[#c7dde0] bg-[#f8fbfd] p-5 text-center transition-colors hover:border-[#01b7bb]/60 hover:bg-[#f1fbfa]"
                    >
                      {selectedFile ? (
                        <div
                          className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-left ring-1 ring-[#dfe8eb]"
                          onClick={(event) => event.preventDefault()}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f7f4] text-[#087a7b]">
                              <FileIcon className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#071923]">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-[#64747c]">
                                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearFile}
                            aria-label="Remove selected file"
                            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#64747c] transition-colors hover:bg-[#fff4f0] hover:text-[#9b2c12]"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#e8f7f4] text-[#01b7bb] transition-transform group-hover:scale-105">
                            <FileUp className="size-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-bold text-[#071923]">
                              Upload license, CV, or profile photo
                            </span>
                            <span className="mt-0.5 block text-xs text-[#64747c]">
                              JPG, PNG, WebP, or PDF, up to 12 MB
                            </span>
                          </span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        id="doctor-application-file"
                        name="file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </FormSection>

                  {error ? (
                    <p role="alert" className="rounded-xl bg-[#fff4f0] px-4 py-3 text-sm text-[#9b2c12]">
                      {error}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={pending}
                    className="h-12 rounded-full bg-[#01b7bb] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#019ea2] active:translate-y-0 active:scale-[0.98]"
                  >
                    {pending ? "Submitting..." : "Submit application"}
                    <ArrowRight className="size-4" />
                  </Button>

                  <p className="flex items-start gap-2 text-xs leading-5 text-[#60717a]">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#01b7bb]" />
                    Submission starts a credential review before provider access is opened.
                  </p>
                </form>
              )}
            </section>
          </Reveal>
        </div>
      </div>
    </main>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-[#eef2f3] pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-bold text-[#071923]">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      <span>
        {label}
        {required ? (
          <span className="ml-0.5 text-[#dc2626]">*</span>
        ) : (
          <span className="ml-1 text-xs font-normal text-[#8a969c]">(optional)</span>
        )}
      </span>
      {children}
    </label>
  );
}

function Check({ name, value, label }: { name: string; value: string; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-[#dfe8eb] transition-colors hover:ring-[#01b7bb]/50">
      <input name={name} value={value} type="checkbox" defaultChecked className="size-4 accent-[#01b7bb]" />
      {label}
    </label>
  );
}
