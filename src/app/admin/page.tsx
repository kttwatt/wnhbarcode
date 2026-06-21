import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAdminPrescanStats } from "@/lib/data/prescan";

export default async function AdminPage() {
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    { count: itemCount },
    { count: deptCount },
    { count: userCount },
    { data: deptItems },
    { count: totalItems },
    { count: scansToday },
    prescanStats,
  ] = await Promise.all([
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("departments")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("department_items").select("item_id").is("deleted_at", null),
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("scan_logs")
      .select("*", { count: "exact", head: true })
      .gte("scanned_at", startOfToday.toISOString()),
    getAdminPrescanStats(),
  ]);

  const assignedIds = new Set((deptItems || []).map((d) => d.item_id));
  const unassignedCount = Math.max(0, (totalItems ?? 0) - assignedIds.size);

  const stats = [
    { label: "รายการพัสดุ", value: itemCount ?? 0, href: "/admin/items" },
    { label: "แผนก", value: deptCount ?? 0, href: "/admin/org" },
    { label: "ผู้ใช้", value: userCount ?? 0, href: "/admin/org" },
    { label: "ยังไม่กำหนดแผนก", value: unassignedCount, href: "/admin/items" },
    { label: "รอสแกน (จดไว้ก่อน)", value: prescanStats.pending, href: "/admin/prescan" },
    { label: "สแกนวันนี้", value: scansToday ?? 0, href: "/admin/scan-logs" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">ภาพรวม</h1>
        <p className="text-sm text-slate-500">จัดการข้อมูลหลักของระบบ</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-teal-300"
          >
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">
              {value}
            </dd>
          </Link>
        ))}
      </dl>

      {prescanStats.stale > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            มี {prescanStats.stale} รายการ &quot;จดไว้ก่อน&quot; ค้างนานเกิน 24 ชม. —{" "}
            <Link href="/admin/prescan" className="font-medium underline">
              ไปจัดการ
            </Link>
          </p>
        </div>
      )}

      {unassignedCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            มี {unassignedCount} รายการที่ยังไม่ได้กำหนดแผนก —{" "}
            <Link href="/admin/items" className="font-medium underline">
              ไปจัดการ
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
