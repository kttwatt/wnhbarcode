"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const RESET_PASSWORD_PATH = "/auth/reset-password";

function safeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}

function resolveDestination(
  searchParams: URLSearchParams,
  hashParams: URLSearchParams
): string {
  const type = searchParams.get("type") ?? hashParams.get("type");
  if (type === "recovery") {
    return RESET_PASSWORD_PATH;
  }

  const next = searchParams.get("next");
  if (next?.includes("reset-password")) {
    return RESET_PASSWORD_PATH;
  }

  return safeNextPath(next);
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [message, setMessage] = useState("กำลังเข้าสู่ระบบ...");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const hashParams = new URLSearchParams(
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash
    );
    const destination = resolveDestination(searchParams, hashParams);
    const errorPath = destination.includes("reset-password")
      ? "/login?error=reset_link"
      : "/login?error=auth";

    async function finish() {
      const supabase = createClient();
      const code = searchParams.get("code");
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage("ลิงก์ไม่ถูกต้อง กำลังกลับไปหน้าเข้าสู่ระบบ...");
          router.replace(errorPath);
          return;
        }
        const isRecovery = !!data.session?.user?.recovery_sent_at;
        router.replace(isRecovery ? RESET_PASSWORD_PATH : destination);
        router.refresh();
        return;
      }

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash });
        if (error) {
          setMessage("ลิงก์ไม่ถูกต้อง กำลังกลับไปหน้าเข้าสู่ระบบ...");
          router.replace(errorPath);
          return;
        }
        router.replace(destination);
        router.refresh();
        return;
      }

      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          setMessage("ลิงก์ไม่ถูกต้อง กำลังกลับไปหน้าเข้าสู่ระบบ...");
          router.replace(errorPath);
          return;
        }
        router.replace(destination);
        router.refresh();
        return;
      }

      setMessage("ลิงก์ไม่ถูกต้อง กำลังกลับไปหน้าเข้าสู่ระบบ...");
      router.replace(errorPath);
    }

    void finish();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}
