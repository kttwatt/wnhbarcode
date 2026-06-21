import Link from "next/link";
import {
  ScanLine,
  ClipboardList,
  Package,
  Star,
  ArrowRight,
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/primitives";
import { getActiveDepartmentId, getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile) redirect("/login");
  if (!departmentId) return null;

  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: scanCount },
    { count: itemCount },
    { data: favorites },
    { data: deptRows },
  ] = await Promise.all([
    supabase
      .from("scan_logs")
      .select("*", { count: "exact", head: true })
      .eq("department_id", departmentId)
      .gte("scanned_at", today.toISOString()),
    supabase
      .from("department_items")
      .select("*", { count: "exact", head: true })
      .eq("department_id", departmentId)
      .is("deleted_at", null),
    supabase
      .from("user_favorites")
      .select("id, item_id, sort_order, items(*)")
      .eq("user_id", profile.id)
      .order("sort_order"),
    supabase
      .from("department_items")
      .select("item_id")
      .eq("department_id", departmentId)
      .is("deleted_at", null),
  ]);

  const deptItemIds = new Set((deptRows || []).map((row) => row.item_id));
  const favItems = (favorites || [])
    .map((f) => {
      const item = f.items;
      return item && !Array.isArray(item) ? (item as Item) : null;
    })
    .filter((item): item is Item => Boolean(item && deptItemIds.has(item.id)));
  const previewFavItems = favItems.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          แดชบอร์ด
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ภาพรวมการใช้งานวันนี้ — แผนกของคุณ
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="สแกนวันนี้"
          value={scanCount ?? 0}
          icon={ScanLine}
          accent="teal"
          hint="รายการที่บันทึกแล้ว"
          href="/dashboard/scans"
        />
        <StatCard
          label="รายการในแผนก"
          value={itemCount ?? 0}
          icon={Package}
          accent="slate"
          href="/dashboard/items"
        />
        <StatCard
          label="รายการโปรด"
          value={favItems.length}
          icon={Star}
          accent="violet"
          href="/dashboard/scan"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-teal-700/10" />
          <div className="relative">
            <h2 className="mb-1 font-semibold text-slate-900">เริ่มสแกน</h2>
            <p className="mb-4 text-sm text-slate-500">
              สแกนเข้า IPISS ทันที หรือจดรายการไว้ก่อนเพื่อสแกนทีหลัง
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/scan"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800"
              >
                <ScanLine className="h-4 w-4" />
                สแกนเลย
                <ArrowRight className="h-4 w-4 opacity-70" />
              </Link>
              <Link
                href="/dashboard/prescan"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
              >
                <ClipboardList className="h-4 w-4" />
                จดไว้ก่อน
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold text-slate-900">จัดการแผนก</h2>
          <p className="mb-4 text-sm text-slate-500">
            เพิ่มหรือลบรายการที่ใช้ในแผนกของคุณ
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/items"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              <Package className="h-4 w-4" />
              แผนก
            </Link>
          </div>
        </Card>
      </div>

      {previewFavItems.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
            <h2 className="font-semibold text-slate-900">รายการโปรด</h2>
          </div>
          <ul className="space-y-2">
            {previewFavItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-mono text-xs text-teal-700">
                    {item.code}
                  </span>{" "}
                  — {item.name}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/scan"
            className="mt-4 inline-flex items-center gap-1 text-sm text-teal-700 hover:underline"
          >
            ไปหน้าสแกน
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      )}
    </div>
  );
}
