"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Badge, Button, Card, Label, Select } from "@/components/ui/primitives";
import { removePrescanItem } from "@/lib/actions/prescan";
import { cn, formatDateTime } from "@/lib/utils";
import type { Department, PrescanItem } from "@/lib/types";

type StatusFilter = "pending" | "scanned" | "cancelled";

const STATUS_LABEL: Record<StatusFilter, string> = {
  pending: "รอสแกน",
  scanned: "สแกนแล้ว",
  cancelled: "ยกเลิก",
};

export function AdminPrescanClient({
  items,
  departments,
  departmentId,
  status,
  staleHours,
  error,
}: {
  items: PrescanItem[];
  departments: Department[];
  departmentId: string;
  status: StatusFilter;
  staleHours: number;
  error: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const pushParams = (next: { department?: string; status?: string }) => {
    const params = new URLSearchParams();
    const dept = next.department ?? departmentId;
    const st = next.status ?? status;
    if (dept) params.set("department", dept);
    if (st && st !== "pending") params.set("status", st);
    const qs = params.toString();
    router.push(qs ? `/admin/prescan?${qs}` : "/admin/prescan");
  };

  const handleCancel = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      await removePrescanItem(id);
      setBusyId(null);
      router.refresh();
    });
  };

  const isStale = (entry: PrescanItem) =>
    now > 0 &&
    now - new Date(entry.created_at).getTime() > staleHours * 60 * 60 * 1000;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">จดไว้ก่อน</h1>
        <p className="text-sm text-slate-500">
          รายการที่แต่ละแผนกจดไว้รอสแกนเข้า IPISS — {items.length} รายการ
        </p>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="status-filter">สถานะ</Label>
            <Select
              id="status-filter"
              value={status}
              onChange={(e) => pushParams({ status: e.target.value })}
            >
              {(["pending", "scanned", "cancelled"] as StatusFilter[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                )
              )}
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
              <th className="px-4 py-2">แผนก</th>
              <th className="px-4 py-2">รายการ</th>
              <th className="px-4 py-2 text-right">จำนวน</th>
              <th className="px-4 py-2">จดโดย</th>
              {status === "pending" && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={status === "pending" ? 6 : 5}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  ไม่มีรายการ
                </td>
              </tr>
            ) : (
              items.map((entry) => (
                <tr
                  key={entry.id}
                  className={cn(
                    status === "pending" && isStale(entry) && "bg-red-50/40"
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-2 text-xs">
                    {formatDateTime(
                      status === "scanned" && entry.scanned_at
                        ? entry.scanned_at
                        : entry.created_at
                    )}
                    {status === "pending" && isStale(entry) && (
                      <Badge variant="red" className="ml-2 gap-1">
                        <Clock className="h-3 w-3" /> ค้างนาน
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2">{entry.departments?.name || "—"}</td>
                  <td className="px-4 py-2">
                    {entry.item
                      ? `${entry.item.code} — ${entry.item.name}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {entry.qty}
                  </td>
                  <td className="px-4 py-2">
                    {entry.created_by_profile?.full_name ||
                      entry.created_by_profile?.username ||
                      "—"}
                  </td>
                  {status === "pending" && (
                    <td className="px-4 py-2 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        disabled={pending && busyId === entry.id}
                        onClick={() => handleCancel(entry.id)}
                      >
                        ยกเลิก
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
