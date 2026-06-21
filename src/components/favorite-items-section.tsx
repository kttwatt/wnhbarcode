"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { Item } from "@/lib/types";

export function FavoriteItemsSection({
  favorites,
  onScanOne,
}: {
  favorites: Item[];
  onScanOne: (item: Item) => void;
}) {
  if (favorites.length === 0) {
    return (
      <div>
        <h3 className="mb-3 font-medium">รายการโปรด</h3>
        <p className="mb-4 text-sm text-slate-500">ยังไม่มีรายการโปรด</p>
        <Link
          href="/dashboard/items"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
        >
          <Plus className="mr-1 h-4 w-4" />
          เพิ่มรายการโปรด
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 font-medium">รายการโปรด</h3>
      <div className="flex flex-wrap gap-2">
        {favorites.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onScanOne(item)}
            className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-900 hover:bg-teal-100"
          >
            {item.code} — {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
