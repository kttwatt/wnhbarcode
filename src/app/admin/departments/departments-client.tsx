"use client";

import { useActionState, useTransition } from "react";
import {
  createDepartmentAction,
  softDeleteDepartment,
  updateDepartmentAction,
  type SimpleState,
} from "@/lib/actions/admin-departments";
import { Button, Input, Label } from "@/components/ui/primitives";
import { Card } from "@/components/ui/primitives";
import type { Department } from "@/lib/types";

const initial: SimpleState = {};

export function DepartmentsClient({
  departments,
  compact = false,
}: {
  departments: Department[];
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createDepartmentAction,
    initial
  );
  const [, startTransition] = useTransition();

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {!compact && (
        <div>
          <h1 className="text-2xl font-bold">แผนก</h1>
          <p className="text-sm text-slate-500">จัดการแผนกในระบบ</p>
        </div>
      )}
      {compact && (
        <div>
          <h2 className="text-sm font-semibold text-slate-800">แผนก</h2>
          <p className="text-xs text-slate-500">เพิ่มและแก้ไขแผนก</p>
        </div>
      )}

      <Card className={compact ? "p-3" : undefined}>
        <form action={formAction} className="flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="dept-name">ชื่อแผนก</Label>
            <Input id="dept-name" name="name" required />
          </div>
          <div className="w-32">
            <Label htmlFor="dept-code">รหัส</Label>
            <Input id="dept-code" name="code" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending}>
              เพิ่มแผนก
            </Button>
          </div>
        </form>
        {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="mt-2 text-sm text-teal-700">{state.success}</p>
        )}
      </Card>

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">ชื่อ</th>
              <th className="px-4 py-2">รหัส</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {departments.map((dept) => (
              <tr
                key={dept.id}
                className={dept.deleted_at ? "opacity-50" : ""}
              >
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded border border-slate-200 px-2 py-1"
                    defaultValue={dept.name}
                    disabled={!!dept.deleted_at}
                    onBlur={(e) => {
                      const name = e.target.value.trim();
                      if (name && name !== dept.name) {
                        startTransition(() => {
                          void updateDepartmentAction(dept.id, name, dept.code);
                        });
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-24 rounded border border-slate-200 px-2 py-1 font-mono"
                    defaultValue={dept.code || ""}
                    disabled={!!dept.deleted_at}
                    onBlur={(e) => {
                      const code = e.target.value.trim() || null;
                      if (code !== dept.code) {
                        startTransition(() => {
                          void updateDepartmentAction(dept.id, dept.name, code);
                        });
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2">
                  {!dept.deleted_at && (
                    <Button
                      type="button"
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() =>
                        startTransition(() => {
                          void softDeleteDepartment(dept.id);
                        })
                      }
                    >
                      ลบ
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
