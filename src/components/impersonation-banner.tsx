"use client";

import { useTransition } from "react";
import { stopImpersonationAction } from "@/lib/actions/impersonation";
import { Button } from "@/components/ui/primitives";

export function ImpersonationBanner({
  username,
  fullName,
}: {
  username: string;
  fullName: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-900">
      <span>
        กำลังดูในมุมมองของ{" "}
        <strong>{fullName || username}</strong> (@{username})
      </span>
      <Button
        type="button"
        variant="secondary"
        className="px-3 py-1 text-xs"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            void stopImpersonationAction();
          })
        }
      >
        ออกจากมุมมองผู้ใช้
      </Button>
    </div>
  );
}
