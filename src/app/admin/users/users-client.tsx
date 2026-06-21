"use client";

import { useActionState, useTransition } from "react";
import { Eye } from "lucide-react";
import {
  createUserAction,
  updateUserAction,
  type SimpleState,
} from "@/lib/actions/admin-users";
import { startImpersonationAction } from "@/lib/actions/impersonation";
import { Button, Card, Input, Label } from "@/components/ui/primitives";
import type { Department, Profile } from "@/lib/types";

const initial: SimpleState = {};

const selectClass =
  "w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm";

function DepartmentCheckboxes({
  departments,
  selectedIds,
  onChange,
  name = "department_ids",
  compact = false,
}: {
  departments: Department[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  name?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {departments.map((d) => {
        const checked = selectedIds.includes(d.id);
        return (
          <label
            key={d.id}
            className={`inline-flex items-center gap-1 rounded-full border border-slate-200 ${
              compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={d.id}
              checked={checked}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selectedIds, d.id]);
                } else {
                  onChange(selectedIds.filter((id) => id !== d.id));
                }
              }}
            />
            {d.name}
          </label>
        );
      })}
    </div>
  );
}

export function UsersClient({
  users,
  departments,
  userDepartmentMap,
  currentAdminId,
  compact = false,
}: {
  users: Profile[];
  departments: Department[];
  userDepartmentMap: Record<string, string[]>;
  currentAdminId: string | null;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createUserAction, initial);
  const [, startTransition] = useTransition();

  const resolveDepartmentIds = (user: Profile) => {
    const fromMap = userDepartmentMap[user.id];
    if (fromMap?.length) return fromMap;
    return user.department_id ? [user.department_id] : [];
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <div>
          <h1 className="text-xl font-bold">ผู้ใช้</h1>
          <p className="text-xs text-slate-500">สร้างและแก้ไขบัญชีผู้ใช้</p>
        </div>
      )}
      {compact && (
        <div>
          <h2 className="text-sm font-semibold text-slate-800">ผู้ใช้</h2>
          <p className="text-xs text-slate-500">สร้างและแก้ไขบัญชี</p>
        </div>
      )}

      <Card className={compact ? "p-3" : "p-3"}>
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-semibold marker:content-none">
            <span className="text-teal-700 group-open:hidden">+ สร้างผู้ใช้ใหม่</span>
            <span className="hidden text-teal-700 group-open:inline">− สร้างผู้ใช้ใหม่</span>
          </summary>
          <form
            action={formAction}
            className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <Label htmlFor="email" className="mb-0.5 text-xs">
                อีเมล
              </Label>
              <Input id="email" name="email" type="email" required className="py-1.5" />
            </div>
            <div>
              <Label htmlFor="username" className="mb-0.5 text-xs">
                ชื่อผู้ใช้
              </Label>
              <Input id="username" name="username" required className="py-1.5" />
            </div>
            <div>
              <Label htmlFor="password" className="mb-0.5 text-xs">
                รหัสผ่าน
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="py-1.5"
              />
            </div>
            <div>
              <Label htmlFor="full_name" className="mb-0.5 text-xs">
                ชื่อ-นามสกุล
              </Label>
              <Input id="full_name" name="full_name" className="py-1.5" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label className="mb-0.5 text-xs">แผนก</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {departments.map((d) => (
                  <label
                    key={d.id}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[11px]"
                  >
                    <input type="checkbox" name="department_ids" value={d.id} />
                    {d.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="role" className="mb-0.5 text-xs">
                บทบาท
              </Label>
              <select id="role" name="role" className={selectClass} defaultValue="user">
                <option value="user">ผู้ใช้</option>
                <option value="admin">ผู้ดูแลระบบ</option>
              </select>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={pending} className="px-3 py-1.5 text-xs">
                สร้างผู้ใช้
              </Button>
            </div>
          </form>
          {state.error && (
            <p className="mt-2 text-xs text-red-600">{state.error}</p>
          )}
          {state.success && (
            <p className="mt-2 text-xs text-teal-700">{state.success}</p>
          )}
        </details>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs">
            <tr>
              <th className="px-3 py-2">ชื่อผู้ใช้</th>
              <th className="px-3 py-2">อีเมล</th>
              <th className="px-3 py-2">ชื่อ</th>
              <th className="px-3 py-2">แผนก</th>
              <th className="px-3 py-2">บทบาท</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const departmentIds = resolveDepartmentIds(user);
              const isSelf = user.id === currentAdminId;

              return (
                <tr key={user.id}>
                  <td className="px-3 py-2">
                    <input
                      className="w-full min-w-[6rem] rounded border border-slate-200 px-2 py-1 text-xs"
                      defaultValue={user.username}
                      onBlur={(e) => {
                        const username = e.target.value.trim();
                        if (username && username !== user.username) {
                          startTransition(() => {
                            void updateUserAction(user.id, {
                              username,
                              full_name: user.full_name,
                              department_id: departmentIds[0] || null,
                              department_ids: departmentIds,
                              role: user.role,
                            });
                          });
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-xs">{user.email}</td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full min-w-[6rem] rounded border border-slate-200 px-2 py-1 text-xs"
                      defaultValue={user.full_name || ""}
                      onBlur={(e) => {
                        const full_name = e.target.value.trim() || null;
                        if (full_name !== user.full_name) {
                          startTransition(() => {
                            void updateUserAction(user.id, {
                              username: user.username,
                              full_name,
                              department_id: departmentIds[0] || null,
                              department_ids: departmentIds,
                              role: user.role,
                            });
                          });
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <UserDepartmentEditor
                      user={user}
                      departments={departments}
                      departmentIds={departmentIds}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded border border-slate-200 px-2 py-1 text-xs"
                      defaultValue={user.role}
                      onChange={(e) => {
                        startTransition(() => {
                          void updateUserAction(user.id, {
                            username: user.username,
                            full_name: user.full_name,
                            department_id: departmentIds[0] || null,
                            department_ids: departmentIds,
                            role: e.target.value,
                          });
                        });
                      }}
                    >
                      <option value="user">ผู้ใช้</option>
                      <option value="admin">ผู้ดูแลระบบ</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <ViewAsUserButton userId={user.id} disabled={isSelf} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ViewAsUserButton({
  userId,
  disabled,
}: {
  userId: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className="whitespace-nowrap px-2 py-1 text-xs"
      disabled={disabled || pending}
      title={disabled ? "ไม่สามารถดูมุมมองของตัวเองได้" : undefined}
      onClick={() =>
        startTransition(() => {
          void startImpersonationAction(userId);
        })
      }
    >
      <Eye className="mr-1 h-3.5 w-3.5" />
      ดูมุมมองผู้ใช้
    </Button>
  );
}

function UserDepartmentEditor({
  user,
  departments,
  departmentIds,
}: {
  user: Profile;
  departments: Department[];
  departmentIds: string[];
}) {
  const [, startTransition] = useTransition();

  return (
    <DepartmentCheckboxes
      departments={departments}
      selectedIds={departmentIds}
      compact
      onChange={(ids) => {
        startTransition(() => {
          void updateUserAction(user.id, {
            username: user.username,
            full_name: user.full_name,
            department_id: ids[0] || null,
            department_ids: ids,
            role: user.role,
          });
        });
      }}
    />
  );
}
