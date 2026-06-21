"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Building2, X } from "lucide-react";
import {
  createItemAction,
  updateItemAction,
  type ItemFormState,
} from "@/lib/actions/admin-items";
import { generateBarcodeValue } from "@/lib/barcode";
import { BarcodePreview } from "@/components/barcode-preview";
import { Badge, Button, Input, Label, Select } from "@/components/ui/primitives";
import type { Department, Item, ItemGroup, ItemSubgroup } from "@/lib/types";

const initial: ItemFormState = {};

type ItemFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  groups: ItemGroup[];
  subgroups: ItemSubgroup[];
  departments: Department[];
  item?: Item | null;
  itemDepartmentIds?: string[];
};

export function ItemFormModal({ open, ...props }: ItemFormModalProps) {
  if (!open) return null;
  return (
    <ItemFormModalContent
      key={props.item?.id ?? "new"}
      {...props}
      open={open}
    />
  );
}

function ItemFormModalContent({
  onClose,
  onSuccess,
  groups,
  subgroups,
  departments,
  item,
  itemDepartmentIds = [],
}: Omit<ItemFormModalProps, "open"> & { open: boolean }) {
  const initialGroupId =
    item?.item_subgroups?.group_id || groups[0]?.id || "";
  const initialSubgroupId =
    item?.subgroup_id ||
    subgroups.find((s) => s.group_id === initialGroupId && !s.deleted_at)?.id ||
    "";

  const [groupId, setGroupId] = useState(initialGroupId);
  const [subgroupId, setSubgroupId] = useState(initialSubgroupId);
  const [code, setCode] = useState(item?.code || "");
  const [name, setName] = useState(item?.name || "");
  const [unit, setUnit] = useState(item?.unit || "");
  const [price, setPrice] = useState(String(item?.price ?? 0));
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(
    () => new Set(itemDepartmentIds)
  );

  const filteredSubgroups = useMemo(
    () => subgroups.filter((s) => s.group_id === groupId && !s.deleted_at),
    [subgroups, groupId]
  );
  const activeSubgroupId = filteredSubgroups.some((s) => s.id === subgroupId)
    ? subgroupId
    : filteredSubgroups[0]?.id || "";

  const action = item
    ? updateItemAction.bind(null, item.id)
    : createItemAction;

  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (!state.success) return;
    onSuccess?.();
    onClose();
  }, [state.success, onClose, onSuccess]);

  const toggleDept = (deptId: string) => {
    setSelectedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {item ? "แก้ไขรายการพัสดุ" : "เพิ่มรายการใหม่"}
            </h2>
            <p className="text-sm text-slate-500">
              กำหนดหมวดหมู่ กลุ่มย่อย และแผนกที่แสดงรายการ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="space-y-5 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="code">รหัส</Label>
              <Input
                id="code"
                name="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น MED001"
              />
            </div>
            <div>
              <Label htmlFor="name">ชื่อ</Label>
              <Input
                id="name"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อพัสดุ"
              />
            </div>
            <div>
              <Label htmlFor="unit">หน่วย</Label>
              <Input
                id="unit"
                name="unit"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="เช่น ชิ้น, กล่อง"
              />
            </div>
            <div>
              <Label htmlFor="price">ราคา (บาท)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">
              หมวดหมู่และกลุ่มย่อย
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="group">กลุ่มพัสดุ (หมวดหมู่)</Label>
                <Select
                  id="group"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.code ? `${g.code} · ${g.name}` : g.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="subgroup_id">กลุ่มย่อย (หมวดหมู่ย่อย)</Label>
                <Select
                  id="subgroup_id"
                  name="subgroup_id"
                  required
                  value={activeSubgroupId}
                  onChange={(e) => setSubgroupId(e.target.value)}
                  disabled={filteredSubgroups.length === 0}
                >
                  {filteredSubgroups.length === 0 ? (
                    <option value="">— ไม่มีกลุ่มย่อย —</option>
                  ) : (
                    filteredSubgroups.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `${s.code} · ${s.name}` : s.name}
                      </option>
                    ))
                  )}
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-700" />
              <p className="text-sm font-medium text-slate-700">
                แผนกที่แสดงรายการ
              </p>
              <Badge variant="teal">{selectedDepts.size} แผนก</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map((d) => {
                const checked = selectedDepts.has(d.id);
                return (
                  <label
                    key={d.id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      checked
                        ? "border-teal-300 bg-teal-50 text-teal-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="department_ids"
                      value={d.id}
                      checked={checked}
                      onChange={() => toggleDept(d.id)}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                    />
                    {d.name}
                    {d.code && (
                      <span className="text-xs text-slate-400">({d.code})</span>
                    )}
                  </label>
                );
              })}
            </div>
            {departments.length === 0 && (
              <p className="text-sm text-slate-500">ยังไม่มีแผนกในระบบ</p>
            )}
          </div>

          {code && (
            <div className="rounded-xl border border-dashed border-slate-200 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                ตัวอย่างบาร์โค้ด
              </p>
              <BarcodePreview
                value={generateBarcodeValue(code)}
                className="mx-auto"
              />
            </div>
          )}

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
              {state.success}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending || !activeSubgroupId}>
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
