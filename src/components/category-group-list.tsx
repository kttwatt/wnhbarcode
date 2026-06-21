"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createGroupAction,
  softDeleteGroup,
  updateGroupAction,
  type CategoryFields,
  type SimpleState,
} from "@/lib/actions/admin-categories";
import { Button, Input, Label } from "@/components/ui/primitives";
import type { ItemGroup } from "@/lib/types";

const initial: SimpleState = {};

export function CategoryGroupList({ groups }: { groups: ItemGroup[] }) {
  const [state, formAction, pending] = useActionState(createGroupAction, initial);
  const [, startTransition] = useTransition();
  const [rowError, setRowError] = useState("");

  const saveGroup = (group: ItemGroup, fields: CategoryFields) => {
    setRowError("");
    startTransition(async () => {
      const res = await updateGroupAction(group.id, fields);
      if (res.error) setRowError(res.error);
    });
  };

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex gap-2">
        <div className="w-24">
          <Label htmlFor="group-code">รหัส</Label>
          <Input id="group-code" name="code" placeholder="เช่น 2" />
        </div>
        <div className="flex-1">
          <Label htmlFor="group-name">เพิ่มกลุ่มพัสดุ</Label>
          <Input id="group-name" name="name" placeholder="ชื่อกลุ่มพัสดุ" required />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>
            เพิ่ม
          </Button>
        </div>
      </form>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-teal-700">{state.success}</p>}
      {rowError && <p className="text-sm text-red-600">{rowError}</p>}

      <ul className="divide-y rounded-lg border">
        {groups.map((group) => (
          <li key={group.id} className="flex items-center gap-2 p-3">
            <input
              className="w-16 rounded border border-slate-200 px-2 py-1 text-center font-mono text-sm"
              defaultValue={group.code ?? ""}
              placeholder="รหัส"
              onBlur={(e) => {
                const code = e.target.value.trim();
                if (code !== (group.code ?? "")) {
                  saveGroup(group, { code });
                }
              }}
            />
            <input
              className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm"
              defaultValue={group.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== group.name) {
                  saveGroup(group, { name });
                }
              }}
            />
            {group.deleted_at ? (
              <span className="text-xs text-slate-400">ถูกลบ</span>
            ) : (
              <Button
                type="button"
                variant="danger"
                className="px-2 py-1 text-xs"
                onClick={() =>
                  startTransition(() => {
                    softDeleteGroup(group.id);
                  })
                }
              >
                ลบ
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
