"use client";

import { useMemo, useState, useTransition } from "react";
import { X, Search } from "lucide-react";
import { addItemsToDepartment } from "@/lib/actions/department-items";
import { Button, Input } from "@/components/ui/primitives";
import type { Item } from "@/lib/types";

export function AddItemToDeptModal({
  items,
  existingItemIds,
  open,
  onClose,
  onSuccess,
}: {
  items: Item[];
  existingItemIds: Set<string>;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const available = useMemo(
    () => items.filter((i) => !existingItemIds.has(i.id) && !i.deleted_at),
    [items, existingItemIds]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (i) =>
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.barcode.toLowerCase().includes(q)
    );
  }, [available, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    setError("");
    startTransition(async () => {
      const result = await addItemsToDepartment([...selected]);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelected(new Set());
      setQuery("");
      onSuccess?.();
      onClose();
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">เพิ่มรายการเข้าแผนก</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="ค้นหารหัส ชื่อ หรือบาร์โค้ด..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">ไม่พบรายการ</p>
          ) : (
            filtered.map((item) => {
              const groupName = item.item_subgroups?.item_groups?.name || null;
              const subgroupName = item.item_subgroups?.name || null;

              return (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggle(item.id)}
                />
                <div>
                  <div className="text-sm font-medium">
                    {item.code} — {item.name}
                  </div>
                  {(groupName || subgroupName) && (
                    <div className="text-xs text-teal-700">
                      {[groupName, subgroupName].filter(Boolean).join(" › ")}
                    </div>
                  )}
                </div>
              </label>
              );
            })
          )}
        </div>

        {error && <p className="px-4 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t p-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            type="button"
            disabled={pending || selected.size === 0}
            onClick={handleSubmit}
          >
            เพิ่ม {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
