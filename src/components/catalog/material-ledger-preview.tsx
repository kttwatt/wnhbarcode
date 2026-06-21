import { CatalogBarcodeCell } from "@/components/catalog/catalog-barcode-cell";
import type { CatalogSection } from "@/lib/data/department-catalog";
import { formatDateTh } from "@/lib/utils";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function MaterialLedgerPreview({
  departmentName,
  sections,
  revisedAt,
  itemCount,
}: {
  departmentName: string;
  sections: CatalogSection[];
  revisedAt: string | null;
  itemCount: number;
}) {
  return (
    <div className="print-catalog mx-auto w-full max-w-[210mm] bg-white p-[12mm] text-slate-900 shadow-sm">
      <div className="ledger-block mb-4" data-block-type="header">
        <header className="flex items-baseline justify-between gap-4 border-b border-slate-300 pb-2">
          <h1 className="text-xl font-bold">
            สมุดรายการวัสดุ — แผนก {departmentName}
          </h1>
          <div className="shrink-0 text-right text-sm text-slate-600">
            <p>วันที่แก้ไข: {revisedAt ? formatDateTh(revisedAt) : "—"}</p>
            <p>จำนวนรายการ: {itemCount} รายการ</p>
          </div>
        </header>
      </div>

      {sections.map((section) => (
        <div key={section.key}>
          <div className="ledger-block mb-2" data-block-type="heading">
            <h2 className="border-l-4 border-teal-600 pl-2 text-xs font-semibold text-teal-800">
              {[section.groupName, section.subgroupName]
                .filter(Boolean)
                .join(" › ") || "ไม่ระบุหมวด"}
            </h2>
          </div>
          {chunk(section.items, 2).map((row, i) => (
            <div
              key={i}
              className="ledger-block mb-2 grid grid-cols-2 gap-2"
              data-block-type="row"
            >
              {row.map((item) => (
                <CatalogBarcodeCell key={item.id} item={item} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
