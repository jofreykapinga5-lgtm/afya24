"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDoctorPassword, type AvailabilityActionState } from "../actions";

const initialState: AvailabilityActionState = { status: "idle", message: "" };

export function DoctorPasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previousState: AvailabilityActionState, formData: FormData) => {
      const result = await updateDoctorPassword(previousState, formData);
      if (result.status === "success") {
        formRef.current?.reset();
      }
      return result;
    },
    initialState
  );

  return (
    <form ref={formRef} action={formAction} className="mt-5 grid gap-4">
      <label className="grid gap-1.5 text-sm">
        <span className="font-bold text-[#071923]">Current password</span>
        <Input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-xl border-[#d8e5e3] bg-[#f8fbfd]"
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-bold text-[#071923]">New password</span>
        <Input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="rounded-xl border-[#d8e5e3] bg-[#f8fbfd]"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-[#01b7bb] px-5 font-bold text-white hover:bg-[#019ea2]"
        >
          {pending ? "Saving..." : "Change password"}
        </Button>
        {state.status === "success" ? (
          <span role="status" className="text-sm font-medium text-[#087a7b]">
            {state.message}
          </span>
        ) : state.status === "error" ? (
          <span role="alert" className="text-sm font-medium text-destructive">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
