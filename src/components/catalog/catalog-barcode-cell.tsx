import { BarcodePreview } from "@/components/barcode-preview";
import type { CatalogItem } from "@/lib/data/department-catalog";

export function CatalogBarcodeCell({ item }: { item: CatalogItem }) {
  return (
    <div className="flex break-inside-avoid flex-col items-center rounded-md border border-slate-300 p-1.5 text-center">
      <BarcodePreview
        value={item.barcode}
        displayValue={false}
        height={36}
        className="max-w-full"
      />
      <div className="-mt-1.5 font-mono text-[10px] font-semibold text-slate-900">
        {item.code}
      </div>
      <div className="line-clamp-2 text-sm leading-tight text-slate-700">
        {item.name}
      </div>
    </div>
  );
}
