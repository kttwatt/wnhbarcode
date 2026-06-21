"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createSubgroupAction,
  softDeleteSubgroup,
  updateSubgroupAction,
  type CategoryFields,
  type SimpleState,
} from "@/lib/actions/admin-categories";
import { Button, Input, Label } from "@/components/ui/primitives";
import type { ItemGroup, ItemSubgroup } from "@/lib/types";

const initial: SimpleState = {};

export function CategorySubgroupList({
  groups,
  subgroups,
}: {
  groups: ItemGroup[];
  subgroups: ItemSubgroup[];
}) {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || "");
  const action = createSubgroupAction.bind(null, selectedGroup);
  const [state, formAction, pending] = useActionState(action, initial);
  const [, startTransition] = useTransition();
  const [rowError, setRowError] = useState("");

  const filtered = subgroups.filter((s) => s.group_id === selectedGroup);

  const saveSubgroup = (sg: ItemSubgroup, fields: CategoryFields) => {
    setRowError("");
    startTransition(async () => {
      const res = await updateSubgroupAction(sg.id, fields);
      if (res.error) setRowError(res.error);
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sg-group">เลือกกลุ่มพัสดุ</Label>
        <select
          id="sg-group"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.code ? `${g.code} · ${g.name}` : g.name}
            </option>
          ))}
        </select>
      </div>

      <form action={formAction} className="flex gap-2">
        <div className="w-24">
          <Label htmlFor="subgroup-code">รหัส</Label>
          <Input id="subgroup-code" name="code" placeholder="เช่น 203" />
        </div>
        <div className="flex-1">
          <Label htmlFor="subgroup-name">เพิ่มกลุ่มย่อย</Label>
          <Input id="subgroup-name" name="name" placeholder="ชื่อกลุ่มย่อย" required />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending || !selectedGroup}>
            เพิ่ม
          </Button>
        </div>
      </form>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-teal-700">{state.success}</p>}
      {rowError && <p className="text-sm text-red-600">{rowError}</p>}

      <ul className="divide-y rounded-lg border">
        {filtered.map((sg) => (
          <li key={sg.id} className="flex items-center gap-2 p-3">
            <input
              className="w-16 rounded border border-slate-200 px-2 py-1 text-center font-mono text-sm"
              defaultValue={sg.code ?? ""}
              placeholder="รหัส"
              onBlur={(e) => {
                const code = e.target.value.trim();
                if (code !== (sg.code ?? "")) {
                  saveSubgroup(sg, { code });
                }
              }}
            />
            <input
              className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm"
              defaultValue={sg.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== sg.name) {
                  saveSubgroup(sg, { name });
                }
              }}
            />
            {sg.deleted_at ? (
              <span className="text-xs text-slate-400">ถูกลบ</span>
            ) : (
              <Button
                type="button"
                variant="danger"
                className="px-2 py-1 text-xs"
                onClick={() =>
                  startTransition(() => {
                    softDeleteSubgroup(sg.id);
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
