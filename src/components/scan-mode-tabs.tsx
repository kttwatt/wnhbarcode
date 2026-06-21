"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScanModeTabs({ prescanCount = 0 }: { prescanCount?: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard/scan", label: "สแกนเลย", icon: ScanLine, count: 0 },
    {
      href: "/dashboard/prescan",
      label: "จดไว้ก่อน",
      icon: ClipboardList,
      count: prescanCount,
    },
  ];

  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-white text-teal-700 shadow-sm ring-1 ring-black/5"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={cn(
                  "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                  active
                    ? "bg-amber-100 text-amber-800"
                    : "bg-amber-500 text-white"
                )}
              >
                {tab.count > 99 ? "99+" : tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
