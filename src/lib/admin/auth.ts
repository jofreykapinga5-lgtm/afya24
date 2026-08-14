import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// Shared by every "use server" admin action file. Deliberately NOT itself
// marked "use server" -- that directive forces every export of a file to be
// an async server action (only async functions are allowed), which would
// break formString/actionErrorMessage below. Keeping this a plain
// server-only module lets multiple action files import the same admin
// auth check without either constraint tripping the other.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/doctor");
  }

  const service = createServiceClient();
  const { data: profile, error } = await service
    .from("users")
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin" || profile.status !== "active") {
    redirect("/doctor/dashboard");
  }

  return { adminUserId: user.id, service };
}

export function actionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
