"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ScanLine,
  ClipboardList,
  Package,
  Shield,
  Menu,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "wnh-sidebar-expanded";

const links = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/dashboard/scan", label: "สแกนเลย", icon: ScanLine },
  { href: "/dashboard/prescan", label: "จดไว้ก่อน", icon: ClipboardList },
  { href: "/dashboard/items", label: "แผนก", icon: Package },
];

export function AppSidebar({
  isAdmin,
  prescanCount = 0,
}: {
  isAdmin: boolean;
  prescanCount?: number;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "true") setExpanded(true);
    setReady(true);
  }, []);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const navLinks = isAdmin
    ? [...links, { href: "/admin", label: "ผู้ดูแลระบบ", icon: Shield }]
    : links;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out",
        expanded ? "w-56" : "w-14",
        !ready && "w-14"
      )}
      aria-expanded={expanded}
    >
      {/* Header with hamburger button */}
      <div className="flex items-center border-b border-slate-100 px-2 py-3">
        <button
          type="button"
          onClick={toggleExpanded}
          className={cn(
            "flex shrink-0 items-center rounded-lg text-teal-800 transition hover:bg-teal-50 active:scale-95",
            expanded
              ? "gap-1.5 p-1.5 bg-teal-50"
              : "w-full flex-col gap-0.5 p-1"
          )}
          aria-label={expanded ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={expanded}
          aria-controls="app-sidebar-nav"
        >
          {expanded ? (
            <PanelLeftClose className="h-5 w-5 shrink-0" />
          ) : (
            <Menu className="h-5 w-5 shrink-0" />
          )}
          <span
            className={cn(
              "font-medium leading-none",
              expanded ? "text-sm" : "text-[10px]"
            )}
          >
            {expanded ? "ปิด" : "Menu"}
          </span>
        </button>
        <span
          className={cn(
            "ml-2 overflow-hidden text-lg font-bold whitespace-nowrap text-teal-800 transition-all duration-300",
            expanded ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
          )}
        >
          WNHBarcode
        </span>
      </div>

      {/* Navigation links */}
      <nav id="app-sidebar-nav" className="flex-1 space-y-1 p-2">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          const showBadge =
            href === "/dashboard/prescan" && prescanCount > 0;
          const badgeText = prescanCount > 99 ? "99+" : String(prescanCount);
          return (
            <Link
              key={href}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition",
                expanded ? "px-3" : "justify-center",
                active
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {showBadge && !expanded && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold leading-none text-white">
                    {badgeText}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300",
                  expanded ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
                )}
              >
                {label}
                {showBadge && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                    {badgeText}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
