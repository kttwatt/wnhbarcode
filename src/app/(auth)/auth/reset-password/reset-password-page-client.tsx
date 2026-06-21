"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ResetPasswordForm } from "./reset-password-form";

function parseHashParams(): URLSearchParams {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

export function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function init() {
      const supabase = createClient();
      const code = searchParams.get("code");
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      const hashParams = parseHashParams();

      if (code) {
        await supabase.auth.signOut();
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError("ลิงก์หมดอายุหรือใช้ไปแล้ว กรุณาขอลิงก์ใหม่");
          setReady(true);
          return;
        }
        window.history.replaceState({}, "", "/auth/reset-password");
        setReady(true);
        return;
      }

      if (token_hash && type) {
        await supabase.auth.signOut();
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type,
          token_hash,
        });
        if (verifyError) {
          setError("ลิงก์หมดอายุหรือใช้ไปแล้ว กรุณาขอลิงก์ใหม่");
          setReady(true);
          return;
        }
        window.history.replaceState({}, "", "/auth/reset-password");
        setReady(true);
        return;
      }

      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      if (access_token && refresh_token) {
        await supabase.auth.signOut();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) {
          setError("ลิงก์หมดอายุหรือใช้ไปแล้ว กรุณาขอลิงก์ใหม่");
          setReady(true);
          return;
        }
        window.history.replaceState({}, "", "/auth/reset-password");
        setReady(true);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?error=reset_session");
        return;
      }

      setReady(true);
    }

    void init();
  }, [router, searchParams]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <p className="text-sm text-slate-600">กำลังเตรียมหน้าตั้งรหัสผ่าน...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
