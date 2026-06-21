"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookText, Plus, Trash2 } from "lucide-react";
import { AddItemToDeptModal } from "@/components/add-item-to-dept-modal";
import { FavoriteStarButton } from "@/components/favorite-star-button";
import { removeItemFromDepartment } from "@/lib/actions/department-items";
import { Button, Card, PageHeader } from "@/components/ui/primitives";
import { formatPrice } from "@/lib/utils";
import type { DepartmentItem, Item } from "@/lib/types";

export function ItemsClient({
  deptItems,
  masterItems,
  favoriteIds,
}: {
  deptItems: (DepartmentItem & { items: Item })[];
  masterItems: Item[];
  favoriteIds: Set<string>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const existingIds = new Set(deptItems.map((d) => d.item_id));

  const handleRemove = (id: string) => {
    if (!confirm("ลบรายการนี้ออกจากแผนก?")) return;
    startTransition(async () => {
      await removeItemFromDepartment(id);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="แผนก"
        description="จัดการรายการที่ใช้ในแผนกของคุณ"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/catalog"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              <BookText className="mr-1 h-4 w-4" />
              สมุดรายการวัสดุ
            </Link>
            <Button type="button" onClick={() => setModalOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              เพิ่มรายการ
            </Button>
          </div>
        }
      />

      <Card className="p-0">
        <div className="divide-y divide-slate-100">
          {deptItems.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">ยังไม่มีรายการในแผนก</p>
          ) : (
            deptItems.map((row) => {
              const item = row.items;
              if (!item) return null;
              const groupName =
                item.item_subgroups?.item_groups?.name || null;
              const subgroupName = item.item_subgroups?.name || null;

              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/50"
                >
                  <FavoriteStarButton
                    itemId={item.id}
                    active={favoriteIds.has(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {item.code} — {item.name}
                      </span>
                    </div>
                    {(groupName || subgroupName) && (
                      <div className="text-xs text-teal-700">
                        {[groupName, subgroupName].filter(Boolean).join(" › ")}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      {item.barcode} | {item.unit} | {formatPrice(item.price)}{" "}
                      บาท
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleRemove(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <AddItemToDeptModal
        items={masterItems}
        existingItemIds={existingIds}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
