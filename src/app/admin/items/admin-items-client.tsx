"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, RotateCcw, Search, Printer } from "lucide-react";
import { ItemFormModal } from "@/components/item-form-modal";
import { BarcodePrintLabel } from "@/components/barcode-print-label";
import { CategoryGroupList } from "@/components/category-group-list";
import { CategorySubgroupList } from "@/components/category-subgroup-list";
import { restoreItem, softDeleteItem } from "@/lib/actions/admin-items";
import {
  Badge,
  Button,
  Card,
  Input,
} from "@/components/ui/primitives";
import { cn, formatPrice } from "@/lib/utils";
import type { Department, Item, ItemGroup, ItemSubgroup } from "@/lib/types";

export function AdminItemsClient({
  items,
  groups,
  subgroups,
  allGroups,
  allSubgroups,
  departments,
  itemDepartmentMap,
}: {
  items: Item[];
  groups: ItemGroup[];
  subgroups: ItemSubgroup[];
  allGroups: ItemGroup[];
  allSubgroups: ItemSubgroup[];
  departments: Department[];
  itemDepartmentMap: Record<string, string[]>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel") === "categories" ? "categories" : "items";
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [printItem, setPrintItem] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [isPending, startTransition] = useTransition();

  const deptById = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d])),
    [departments]
  );

  const groupById = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g])),
    [groups]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const deptIds = itemDepartmentMap[item.id] || [];
      if (filterDept === "none" && deptIds.length > 0) return false;
      if (filterDept && filterDept !== "none" && !deptIds.includes(filterDept)) {
        return false;
      }
      if (!q) return true;
      return (
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q)
      );
    });
  }, [items, search, filterDept, itemDepartmentMap]);

  const unassignedCount = items.filter(
    (i) => !i.deleted_at && !(itemDepartmentMap[i.id]?.length)
  ).length;

  const openCreate = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleDelete = (item: Item) => {
    if (!confirm(`ลบรายการ "${item.name}" ?`)) return;
    startTransition(async () => {
      await softDeleteItem(item.id);
    });
  };

  const handleRestore = (item: Item) => {
    startTransition(async () => {
      await restoreItem(item.id);
    });
  };

  const setPanel = (next: "items" | "categories") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "categories") params.set("panel", "categories");
    else params.delete("panel");
    const qs = params.toString();
    router.push(qs ? `/admin/items?${qs}` : "/admin/items");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">พัสดุ</h1>
          <p className="text-sm text-slate-500">จัดการรายการและหมวดหมู่</p>
        </div>
        {panel === "items" && (
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit">
        {(
          [
            ["items", "รายการ"],
            ["categories", "หมวดหมู่"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPanel(key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              panel === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {panel === "categories" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">กลุ่มพัสดุ</h2>
            <CategoryGroupList groups={allGroups} />
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">กลุ่มย่อย</h2>
            <CategorySubgroupList
              groups={allGroups.filter((g) => !g.deleted_at)}
              subgroups={allSubgroups}
            />
          </Card>
        </div>
      ) : (
        <>
      {unassignedCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          มี {unassignedCount} รายการที่ยังไม่ได้กำหนดแผนก
        </div>
      )}

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัส ชื่อ หรือบาร์โค้ด..."
            className="pl-9"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">ทุกแผนก</option>
          <option value="none">ยังไม่กำหนดแผนก</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <Badge variant="slate">{filtered.length} รายการ</Badge>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">รหัส / ชื่อ</th>
                <th className="px-4 py-3">หมวดหมู่</th>
                <th className="px-4 py-3">แผนก</th>
                <th className="px-4 py-3">ราคา</th>
                <th className="px-4 py-3 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const deptIds = itemDepartmentMap[item.id] || [];
                const groupId = item.item_subgroups?.group_id;
                const groupName =
                  (item.item_subgroups as { item_groups?: { name: string } })
                    ?.item_groups?.name ||
                  (groupId ? groupById[groupId]?.name : null);

                return (
                  <tr
                    key={item.id}
                    className={
                      item.deleted_at
                        ? "bg-slate-50/80 opacity-60"
                        : "transition hover:bg-slate-50/50"
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-teal-700">
                        {item.code}
                      </div>
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        {item.barcode} · {item.unit}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{groupName || "—"}</div>
                      <div className="text-xs text-slate-500">
                        {item.item_subgroups?.name || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {deptIds.length === 0 ? (
                          <Badge variant="amber">ไม่แสดง</Badge>
                        ) : (
                          deptIds.map((id) => (
                            <Badge key={id} variant="teal">
                              {deptById[id]?.name || id.slice(0, 6)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatPrice(Number(item.price))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1"
                          onClick={() => openEdit(item)}
                          title="แก้ไข"
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1"
                          onClick={() => setPrintItem(item)}
                          title="พิมพ์"
                          disabled={isPending}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {item.deleted_at ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRestore(item)}
                            title="กู้คืน"
                            disabled={isPending}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(item)}
                            title="ลบ"
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    ไม่พบรายการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

          <ItemFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            groups={groups}
            subgroups={subgroups}
            departments={departments}
            item={editItem}
            itemDepartmentIds={
              editItem ? itemDepartmentMap[editItem.id] || [] : []
            }
          />

          {printItem && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
              onClick={() => setPrintItem(null)}
            >
              <div
                className="rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <BarcodePrintLabel item={printItem} />
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setPrintItem(null)}
                  >
                    ปิด
                  </Button>
                  <Button type="button" onClick={() => window.print()}>
                    พิมพ์
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
