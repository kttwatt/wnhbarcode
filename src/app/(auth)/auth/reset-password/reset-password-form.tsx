"use client";

import { useActionState } from "react";
import { resetPasswordAction, type AuthState } from "@/lib/actions/auth";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

const initial: AuthState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold text-teal-800">ตั้งรหัสผ่านใหม่</h1>
        <p className="mb-6 text-sm text-slate-500">กรอกรหัสผ่านใหม่ของคุณ</p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="password">รหัสผ่านใหม่</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="confirm">ยืนยันรหัสผ่าน</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            บันทึกรหัสผ่าน
          </Button>
        </form>
      </Card>
    </div>
  );
}
