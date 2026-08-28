"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Every plain <form action={serverAction}> has no pending UI at all by
// default -- during the real network round trip the button just sits there
// looking identical to its resting state, which reads as "stuck" and
// invites a second click (or a hard refresh) before the first request even
// finishes. useFormStatus only works inside a child of the <form>, so this
// has to be its own component, not inline in the parent. Shared (not
// admin-only) -- also used by the staff sign-in form, whose round trip
// (auth + role lookup + a heavy dashboard redirect) is exactly this pattern.
export function SubmitButton({
  children,
  pendingText,
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
