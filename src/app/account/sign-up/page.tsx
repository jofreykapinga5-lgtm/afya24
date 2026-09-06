import { redirect } from "next/navigation";

// There's no separate sign-up flow anymore -- the phone+OTP form behind
// /account already handles a first-time number transparently (creates the
// account), a returning one (signs in), or an orphaned guest/AI-intake
// record (claims it), all in verifyPatientOtp. This kept existing only so
// any old bookmark/link to /account/sign-up still lands somewhere real
// instead of 404ing, preserving redirectTo/error query params.
export default async function AccountSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.error) query.set("error", params.error);
  if (params.redirectTo) query.set("redirectTo", params.redirectTo);
  const suffix = query.toString();
  redirect(`/account${suffix ? `?${suffix}` : ""}`);
}
