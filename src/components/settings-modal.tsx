"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { KeyRound, UserRound, X } from "lucide-react";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "password";

export function SettingsModal({
  open,
  onClose,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  profile: Pick<Profile, "username" | "email" | "full_name">;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="settings-modal-title" className="text-lg font-semibold">
            ตั้งค่า
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b px-5">
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition",
              tab === "profile"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <UserRound className="h-4 w-4" />
            จัดการโปรไฟล์
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition",
              tab === "password"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <KeyRound className="h-4 w-4" />
            จัดการรหัสผ่าน
          </button>
        </div>

        <div className="px-5 py-5">
          {tab === "profile" ? (
            <ProfileForm
              embedded
              hideHeader
              profile={profile}
              onSuccess={() => router.refresh()}
            />
          ) : (
            <ChangePasswordForm embedded hideHeader />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
