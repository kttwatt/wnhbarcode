"use client";

import { useActionState } from "react";
import { changePasswordAction, type AuthState } from "@/lib/actions/auth";
import { Button, Input, Label } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const initial: AuthState = {};

const NEW_PASSWORD_PLACEHOLDER =
  "อย่างน้อย 6 ตัวอักษร, ต้องไม่ซ้ำรหัสปัจจุบัน";
const CONFIRM_PASSWORD_PLACEHOLDER =
  "กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน";

export function ChangePasswordForm({
  embedded = false,
  hideHeader = false,
}: {
  embedded?: boolean;
  hideHeader?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initial
  );

  return (
    <section className={cn(!embedded && "max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm")}>
      {!hideHeader && (
        <>
          <h2 className="mb-1 text-lg font-bold text-teal-800">จัดการรหัสผ่าน</h2>
          <p className="mb-4 text-sm text-slate-500">
            กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่
          </p>
        </>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="settings-current_password">รหัสผ่านปัจจุบัน</Label>
          <Input
            id="settings-current_password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            placeholder="รหัสผ่านที่ใช้อยู่ตอนนี้"
            required
          />
        </div>
        <div>
          <Label htmlFor="settings-password">รหัสผ่านใหม่</Label>
          <Input
            id="settings-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={NEW_PASSWORD_PLACEHOLDER}
            required
            minLength={6}
          />
        </div>
        <div>
          <Label htmlFor="settings-confirm">ยืนยันรหัสผ่านใหม่</Label>
          <Input
            id="settings-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            placeholder={CONFIRM_PASSWORD_PLACEHOLDER}
            required
            minLength={6}
          />
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

        <Button type="submit" disabled={pending}>
          บันทึกรหัสผ่าน
        </Button>
      </form>
    </section>
  );
}
