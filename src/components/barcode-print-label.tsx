"use client";

import { BarcodePreview } from "@/components/barcode-preview";
import { formatPrice } from "@/lib/utils";
import type { Item } from "@/lib/types";

export function BarcodePrintLabel({ item }: { item: Item }) {
  return (
    <div className="print-label mx-auto w-[280px] rounded-lg border border-slate-300 bg-white p-4 text-center">
      <BarcodePreview value={item.barcode} className="mx-auto" />
      <div className="mt-2 text-sm font-semibold">{item.code}</div>
      <div className="text-sm">{item.name}</div>
      <div className="mt-1 text-xs text-slate-600">
        หน่วย: {item.unit} | ราคา: {formatPrice(item.price)} บาท
      </div>
    </div>
  );
}
