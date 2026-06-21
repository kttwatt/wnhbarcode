"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

const initial: AuthState = {};

const queryErrors: Record<string, string> = {
  reset_link: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุหรือใช้ไปแล้ว กรุณาขอลิงก์ใหม่",
  reset_session: "กรุณาเปิดลิงก์รีเซ็ตรหัสผ่านจากอีเมลอีกครั้ง",
  auth: "ลิงก์ไม่ถูกต้องหรือหมดอายุ",
};

export function LoginForm({ queryErrorKey }: { queryErrorKey?: string }) {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    loginAction,
    initial
  );

  const queryError = queryErrors[queryErrorKey || ""] || "";
  const passwordError = passwordState.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold text-teal-800">WNHBarcode</h1>
        </div>

        <form action={passwordAction} className="space-y-4">
          <div>
            <Label htmlFor="username">ชื่อผู้ใช้</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {(passwordError || queryError) && (
            <p className="text-sm text-red-600" role="alert">
              {passwordError || queryError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={passwordPending}>
            เข้าสู่ระบบ
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-teal-700 hover:underline">
            ลืมรหัสผ่าน?
          </Link>
        </p>
      </Card>
    </div>
  );
}
