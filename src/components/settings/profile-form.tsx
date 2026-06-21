"use client";

import { useActionState } from "react";
import {
  updateProfileAction,
  type AccountState,
} from "@/lib/actions/account";
import { Button, Input, Label } from "@/components/ui/primitives";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const initial: AccountState = {};

export function ProfileForm({
  profile,
  embedded = false,
  hideHeader = false,
  onSuccess,
}: {
  profile: Pick<Profile, "username" | "email" | "full_name">;
  embedded?: boolean;
  hideHeader?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: AccountState, formData: FormData) => {
      const result = await updateProfileAction(prev, formData);
      if (result.success) onSuccess?.();
      return result;
    },
    initial
  );

  return (
    <section className={cn(!embedded && "max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm")}>
      {!hideHeader && (
        <>
          <h2 className="mb-1 text-lg font-bold text-teal-800">จัดการโปรไฟล์</h2>
          <p className="mb-4 text-sm text-slate-500">แก้ไขชื่อที่แสดงในระบบ</p>
        </>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="settings-username">ชื่อผู้ใช้</Label>
          <Input
            id="settings-username"
            name="username"
            value={profile.username}
            readOnly
            disabled
            className="bg-slate-50 text-slate-500"
          />
        </div>
        <div>
          <Label htmlFor="settings-email">อีเมล</Label>
          <Input
            id="settings-email"
            name="email"
            value={profile.email}
            readOnly
            disabled
            className="bg-slate-50 text-slate-500"
          />
        </div>
        <div>
          <Label htmlFor="settings-full_name">ชื่อที่แสดง</Label>
          <Input
            id="settings-full_name"
            name="full_name"
            defaultValue={profile.full_name || ""}
            placeholder="ชื่อ-นามสกุล"
            autoComplete="name"
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
          บันทึกโปรไฟล์
        </Button>
      </form>
    </section>
  );
}
