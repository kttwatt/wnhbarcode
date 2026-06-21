"use client";

import { useMemo, useState } from "react";
import { BackButton } from "@/components/back-button";
import { Card, Input, Label } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import type { ScanLog } from "@/lib/types";

export function DepartmentScansClient({
  logs,
  error,
  title,
  description,
}: {
  logs: ScanLog[];
  error: string | null;
  title: string;
  description: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) => {
      const itemLabel = log.items
        ? `${log.items.code} ${log.items.name}`.toLowerCase()
        : "";
      const userLabel = (
        log.profiles?.full_name ||
        log.profiles?.username ||
        ""
      ).toLowerCase();

      return (
        log.scanned_barcode.toLowerCase().includes(q) ||
        itemLabel.includes(q) ||
        userLabel.includes(q)
      );
    });
  }, [logs, query]);

  return (
    <div className="space-y-6">
      <div>
        <BackButton className="mb-3" />
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <Card>
        <Label htmlFor="scan-search">ค้นหา</Label>
        <Input
          id="scan-search"
          placeholder="รหัส, ชื่อ, บาร์โค้ด, ผู้ใช้..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 max-w-sm"
        />
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
              <th className="px-4 py-2">ผู้ใช้</th>
              <th className="px-4 py-2">รายการ</th>
              <th className="px-4 py-2">บาร์โค้ดที่สแกน</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  {logs.length === 0 ? "ยังไม่มีประวัติ" : "ไม่พบรายการที่ค้นหา"}
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs">
                    {formatDateTime(log.scanned_at)}
                  </td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
