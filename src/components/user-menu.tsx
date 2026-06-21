"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { SettingsModal } from "@/components/settings-modal";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function UserMenu({
  username,
  fullName,
  settingsProfile,
}: {
  username: string;
  fullName: string | null;
  settingsProfile: Pick<Profile, "username" | "email" | "full_name">;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const openSettings = () => {
    setOpen(false);
    setSettingsOpen(true);
  };

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-right transition hover:bg-slate-50",
            open && "bg-slate-50"
          )}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <p className="font-medium">{fullName || username}</p>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="font-medium">{fullName || username}</p>
              <p className="text-sm text-slate-500">@{username}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={openSettings}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Settings className="h-4 w-4 shrink-0 text-slate-500" />
              ตั้งค่า
            </button>
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                ออกจากระบบ
              </button>
            </form>
          </div>
        )}
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          router.refresh();
        }}
        profile={settingsProfile}
      />
    </>
  );
}
