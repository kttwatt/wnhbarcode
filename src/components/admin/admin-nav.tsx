"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "ภาพรวม", match: (p: string) => p === "/admin" },
  {
    href: "/admin/items",
    label: "พัสดุ",
    match: (p: string) => p.startsWith("/admin/items") || p.startsWith("/admin/categories"),
  },
  {
    href: "/admin/org",
    label: "องค์กร",
    match: (p: string) =>
      p.startsWith("/admin/org") ||
      p.startsWith("/admin/departments") ||
      p.startsWith("/admin/users"),
  },
  {
    href: "/admin/prescan",
    label: "จดไว้ก่อน",
    match: (p: string) => p.startsWith("/admin/prescan"),
  },
  {
    href: "/admin/scan-logs",
    label: "ประวัติสแกน",
    match: (p: string) => p.startsWith("/admin/scan-logs"),
  },
  {
    href: "/admin/audit",
    label: "Audit log",
    match: (p: string) => p.startsWith("/admin/audit"),
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel");

  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200 pb-px">
      {tabs.map(({ href, label, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-t-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "border-b-2 border-teal-600 text-teal-800"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {label}
            {active && href === "/admin/items" && panel === "categories" && (
              <span className="ml-1 text-xs font-normal text-slate-400">· หมวด</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
