"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import type { Department, ScanLog } from "@/lib/types";

const DAY_OPTIONS = [
  { value: "1", label: "24 ชั่วโมง" },
  { value: "7", label: "7 วัน" },
  { value: "30", label: "30 วัน" },
  { value: "0", label: "ทั้งหมด" },
];

const SOURCE_LABEL: Record<string, string> = {
  scanner: "เครื่องสแกน",
  manual_confirm: "ยืนยันเอง",
};

export function ScanLogsClient({
  logs,
  departments,
  departmentId,
  search,
  source,
  days,
  page,
  hasMore,
  error,
}: {
  logs: ScanLog[];
  departments: Department[];
  departmentId: string;
  search: string;
  source: string;
  days: string;
  page: number;
  hasMore: boolean;
  error: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const firstRun = useRef(true);

  const buildUrl = (next: {
    department?: string;
    q?: string;
    source?: string;
    days?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const dept = next.department ?? departmentId;
    const q = next.q ?? query;
    const src = next.source ?? source;
    const d = next.days ?? days;
    const p = next.page ?? 0;
    if (dept) params.set("department", dept);
    if (q) params.set("q", q);
    if (src) params.set("source", src);
    if (d && d !== "7") params.set("days", d);
    if (p) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/scan-logs?${qs}` : "/admin/scan-logs";
  };

  const push = (next: Parameters<typeof buildUrl>[0]) =>
    router.push(buildUrl(next));

  // Debounce the free-text search into the URL (resets to page 0).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      if (query !== search) push({ q: query, page: 0 });
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">ประวัติการสแกน</h1>
        <p className="text-sm text-slate-500">
          แสดง {logs.length} รายการ (หน้า {page + 1})
        </p>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="department-filter">แผนก</Label>
            <Select
              id="department-filter"
              value={departmentId}
              onChange={(e) => push({ department: e.target.value, page: 0 })}
            >
              <option value="">ทุกแผนก</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="source-filter">ที่มา</Label>
            <Select
              id="source-filter"
              value={source}
              onChange={(e) => push({ source: e.target.value, page: 0 })}
            >
              <option value="">ทั้งหมด</option>
              <option value="scanner">เครื่องสแกน</option>
              <option value="manual_confirm">ยืนยันเอง</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="days-filter">ช่วงเวลา</Label>
            <Select
              id="days-filter"
              value={days}
              onChange={(e) => push({ days: e.target.value, page: 0 })}
            >
              {DAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="scan-log-search">ค้นหา</Label>
            <Input
              id="scan-log-search"
              placeholder="รหัส, ชื่อ, บาร์โค้ด..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          โหลดประวัติไม่สำเร็จ: {error}
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">เวลา</th>
              <th className="px-4 py-2">แผนก</th>
              <th className="px-4 py-2">ผู้ใช้</th>
              <th className="px-4 py-2">รายการ</th>
              <th className="px-4 py-2">บาร์โค้ดที่สแกน</th>
              <th className="px-4 py-2">ที่มา</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  ไม่พบรายการ
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs">
                    {formatDateTime(log.scanned_at)}
                  </td>
                  <td className="px-4 py-2">{log.departments?.name || "—"}</td>
                  <td className="px-4 py-2">
                    {log.profiles?.full_name || log.profiles?.username || "—"}
                  </td>
                  <td className="px-4 py-2">
                    {log.items
                      ? `${log.items.code} — ${log.items.name}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {log.scanned_barcode}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {log.scan_source
                      ? SOURCE_LABEL[log.scan_source] ?? log.scan_source
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 0}
          onClick={() => push({ page: Math.max(0, page - 1) })}
        >
          ก่อนหน้า
        </Button>
        <span className="text-sm text-slate-500">หน้า {page + 1}</span>
        <Button
          type="button"
          variant="secondary"
          disabled={!hasMore}
          onClick={() => push({ page: page + 1 })}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  );
}
