"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type AuthState } from "@/lib/actions/auth";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

const initial: AuthState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold text-teal-800">ลืมรหัสผ่าน</h1>
        <p className="mb-6 text-sm text-slate-500">
          กรอกชื่อผู้ใช้หรืออีเมลเพื่อรับลิงก์รีเซ็ต
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="identifier">ชื่อผู้ใช้ / อีเมล</Label>
            <Input id="identifier" name="identifier" required />
          </div>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="text-sm text-teal-700" role="status">
              {state.success}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            ส่งลิงก์รีเซ็ต
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-teal-700 hover:underline">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </p>
      </Card>
    </div>
  );
}
