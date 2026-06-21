"use client";

import { useRouter } from "next/navigation";
import { Card, Label, Select } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog, Department } from "@/lib/types";

const DAY_OPTIONS = [
  { value: "1", label: "24 ชั่วโมง" },
  { value: "7", label: "7 วัน" },
  { value: "30", label: "30 วัน" },
  { value: "0", label: "ทั้งหมด" },
];

function metadataSummary(metadata: Record<string, unknown> | null): string {
  if (!metadata || Object.keys(metadata).length === 0) return "—";
  return Object.entries(metadata)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}

export function AuditClient({
  logs,
  departments,
  actions,
  departmentId,
  action,
  days,
  error,
}: {
  logs: AuditLog[];
  departments: Department[];
  actions: string[];
  departmentId: string;
  action: string;
  days: string;
  error: string | null;
}) {
  const router = useRouter();

  const pushParams = (next: {
    department?: string;
    action?: string;
    days?: string;
  }) => {
    const params = new URLSearchParams();
    const dept = next.department ?? departmentId;
    const act = next.action ?? action;
    const d = next.days ?? days;
    if (dept) params.set("department", dept);
    if (act) params.set("action", act);
    if (d && d !== "7") params.set("days", d);
    const qs = params.toString();
    router.push(qs ? `/admin/audit?${qs}` : "/admin/audit");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Audit log</h1>
        <p className="text-sm text-slate-500">
          บันทึกการทำงานในระบบ — {logs.length} รายการ
        </p>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="dept-filter">แผนก</Label>
            <Select
              id="dept-filter"
              value={departmentId}
              onChange={(e) => pushParams({ department: e.target.value })}
            >
              <option value="">ทุกแผนก</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="action-filter">การกระทำ</Label>
            <Select
              id="action-filter"
              value={action}
              onChange={(e) => pushParams({ action: e.target.value })}
            >
              <option value="">ทั้งหมด</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="days-filter">ช่วงเวลา</Label>
            <Select
              id="days-filter"
              value={days}
              onChange={(e) => pushParams({ days: e.target.value })}
            >
              {DAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          โหลดข้อมูลไม่สำเร็จ: {error}
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">เวลา</th>
              <th className="px-4 py-2">ผู้ทำ</th>
              <th className="px-4 py-2">แผนก</th>
              <th className="px-4 py-2">การกระทำ</th>
              <th className="px-4 py-2">รายละเอียด</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  ไม่มีรายการ
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-2">
                    {log.actor_profile?.full_name ||
                      log.actor_profile?.username ||
                      "—"}
                  </td>
                  <td className="px-4 py-2">{log.departments?.name || "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {metadataSummary(log.metadata)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
