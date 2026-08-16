"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Every admin mutation is a plain <form action={serverAction}> with no
// pending UI at all -- during the real network round trip the button just
// sits there looking identical to its resting state, which reads as "stuck"
// and invites a second click (or a hard refresh) before the first request
// even finishes. useFormStatus only works inside a child of the <form>, so
// this has to be its own component, not inline in the parent.
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
