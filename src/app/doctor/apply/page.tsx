"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, FileUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function DoctorApplicationPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

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

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <section className="overflow-hidden rounded-[1.75rem] bg-[#e8f7f4] p-5 ring-1 ring-[#ccece7] sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a7b]">For doctors</p>
            <h1 className="mt-4 max-w-sm text-3xl font-bold leading-tight sm:text-4xl">
              Join Afya24 as a trusted online doctor
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#4d5960]">
              Apply to join our verified provider network. Admin reviews your license details before any patient routing is enabled.
            </p>

            <div className="relative mt-6 aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_70px_-45px_rgba(8,50,115,0.55)]">
              <Image
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=900&q=80"
                alt="Black doctor in a white coat"
                fill
                sizes="(min-width: 1024px) 420px, 100vw"
                className="object-cover object-top"
              />
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_24px_80px_-55px_rgba(8,50,115,0.55)] ring-1 ring-[#dfe8eb] sm:p-7">
            {success ? (
              <div className="grid min-h-[32rem] place-items-center text-center">
                <div>
                  <CheckCircle2 className="mx-auto size-12 text-[#01b7bb]" />
                  <h2 className="mt-4 text-2xl font-bold">Application submitted</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#60717a]">
                    Afya24 admin will review your details and contact you before creating a doctor account.
                  </p>
                  <Button className="mt-5 rounded-full" nativeButton={false} render={<Link href="/" />}>
                    Back home
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitApplication} className="grid gap-4">
                <div>
                  <h2 className="text-xl font-bold">Doctor application</h2>
                  <p className="mt-1 text-sm text-[#60717a]">Your documents are only visible to Afya24 admins.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name">
                    <Input name="fullName" required placeholder="Dr. Amina Hassan" />
                  </Field>
                  <Field label="Email">
                    <Input name="email" type="email" required placeholder="doctor@email.com" />
                  </Field>
                  <Field label="Phone">
                    <Input name="phone" placeholder="+255..." />
                  </Field>
                  <Field label="License number">
                    <Input name="licenseNumber" required placeholder="Medical council number" />
                  </Field>
                  <Field label="Specialty">
                    <Input name="specialty" required placeholder="General practice" />
                  </Field>
                  <Field label="Region">
                    <Input name="region" placeholder="Dar es Salaam" />
                  </Field>
                  <Field label="Experience years">
                    <Input name="experienceYears" type="number" min="0" max="70" placeholder="5" />
                  </Field>
                </div>

                <fieldset className="rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
                  <legend className="px-1 text-sm font-bold">Languages</legend>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <Check name="languages" value="sw" label="Swahili" />
                    <Check name="languages" value="en" label="English" />
                  </div>
                </fieldset>

                <fieldset className="rounded-2xl bg-[#f8fbfd] p-4 ring-1 ring-[#dfe8eb]">
                  <legend className="px-1 text-sm font-bold">Preferred call modes</legend>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <Check name="consultationModes" value="voice" label="Voice" />
                    <Check name="consultationModes" value="video" label="Video" />
                  </div>
                </fieldset>

                <Field label="Short bio">
                  <Textarea
                    name="bio"
                    placeholder="Tell us what you specialize in and how you support patients."
                    className="min-h-24"
                  />
                </Field>

                <label className="grid gap-2 rounded-2xl bg-[#f8fbfd] p-4 text-sm ring-1 ring-[#dfe8eb]">
                  <span className="flex items-center gap-2 font-bold">
                    <FileUp className="size-4 text-[#01b7bb]" />
                    License, CV, or profile image
                  </span>
                  <input
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="block w-full text-sm text-[#60717a] file:mr-3 file:rounded-full file:border-0 file:bg-[#083273] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                  />
                  <span className="text-xs text-[#64747c]">JPG, PNG, WebP, or PDF under 12 MB.</span>
                </label>

                {error ? <p className="rounded-xl bg-[#fff4f0] px-4 py-3 text-sm text-[#9b2c12]">{error}</p> : null}

                <Button type="submit" disabled={pending} className="h-12 rounded-full bg-[#01b7bb] font-bold text-white hover:bg-[#019ea2]">
                  {pending ? "Submitting..." : "Submit application"}
                  <ArrowRight className="size-4" />
                </Button>

                <p className="flex items-start gap-2 text-xs leading-5 text-[#60717a]">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#01b7bb]" />
                  Submission does not create a doctor account automatically. Admin approval is required.
                </p>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}

function Check({ name, value, label }: { name: string; value: string; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-[#dfe8eb]">
      <input name={name} value={value} type="checkbox" defaultChecked className="size-4 accent-[#01b7bb]" />
      {label}
    </label>
  );
}
