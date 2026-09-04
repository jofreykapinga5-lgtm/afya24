"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { deleteAccount, type AccountActionState } from "../../actions";

const initialState: AccountActionState = { status: "idle", message: "" };

// Deliberately not a one-tap delete (unlike the admin panel's provider
// removal) -- this is a patient permanently losing their own record, so it
// needs real friction: typing DELETE, not just clicking a button, matching
// how the danger-zone body copy above already lays out exactly what's kept
// vs. removed before the patient commits to it.
export function DeleteAccountForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);
  const [confirmText, setConfirmText] = useState("");
  const canSubmit = confirmText === "DELETE" && !pending;

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#c94a3a]">
        {t("account_dashboard_delete_warning", locale)}
      </p>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-[#7a4038]">
          {t("account_dashboard_delete_confirm_label", locale)}
        </span>
        <input
          type="text"
          name="confirm"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder={t("account_dashboard_delete_confirm_placeholder", locale)}
          autoComplete="off"
          className="w-full max-w-[14rem] rounded-xl border border-[#f3d9d6] bg-white px-3 py-2 text-sm font-semibold text-[#071923] outline-none focus:border-[#c94a3a]"
        />
      </label>
      {state.status === "error" ? (
        <p role="alert" className="text-xs font-semibold text-[#c94a3a]">
          {state.message || t("account_dashboard_delete_error", locale)}
        </p>
      ) : null}
      <Button type="submit" variant="destructive" disabled={!canSubmit} className="justify-self-start">
        {pending ? t("account_dashboard_deleting_button", locale) : t("account_dashboard_delete_button", locale)}
      </Button>
    </form>
  );
}
