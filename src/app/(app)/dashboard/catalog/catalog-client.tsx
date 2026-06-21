"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, Printer, X } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { MaterialLedgerPreview } from "@/components/catalog/material-ledger-preview";
import { Button, Card } from "@/components/ui/primitives";
import type { CatalogSection } from "@/lib/data/department-catalog";
import {
  cloneBlockWithGraphics,
  downloadBlob,
  waitForBarcodes,
} from "@/lib/pdf-clone";
import { catalogPdfFileName, type DepartmentExportInfo } from "@/lib/utils";

export function MaterialLedgerClient({
  department,
  sections,
  revisedAt,
  itemCount,
}: {
  department: DepartmentExportInfo & { id: string };
  sections: CatalogSection[];
  revisedAt: string | null;
  itemCount: number;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const pdfBlobRef = useRef<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileName = catalogPdfFileName(department);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    pdfBlobRef.current = null;
  }, [department.id]);

  async function handlePreview() {
    const root = previewRef.current?.querySelector<HTMLElement>(
      ".print-catalog",
    );
    if (!root || generating) return;

    setGenerating(true);
    setError(null);

    const offscreen: HTMLElement[] = [];
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const MM_TO_PX = 96 / 25.4;
      const PAGE_W_MM = 210;
      const PAGE_H_MM = 297;
      const PAD_MM = 12;
      const pageWpx = PAGE_W_MM * MM_TO_PX;
      const pagePadPx = PAD_MM * MM_TO_PX;
      const contentWpx = pageWpx - pagePadPx * 2;
      const contentHpx = (PAGE_H_MM - PAD_MM * 2) * MM_TO_PX;

      await waitForBarcodes(root);

      const blocks = Array.from(
        root.querySelectorAll<HTMLElement>(".ledger-block"),
      );
      if (blocks.length === 0) throw new Error("no content");

      // Measure each block at the exact A4 content width.
      const measure = document.createElement("div");
      measure.className = "text-slate-900";
      measure.style.cssText = `position:fixed;left:-99999px;top:0;width:${contentWpx}px;background:#fff;`;
      document.body.appendChild(measure);
      offscreen.push(measure);

      const measureClones = blocks.map((b) => {
        const c = cloneBlockWithGraphics(b);
        measure.appendChild(c);
        return c;
      });
      const heights = measureClones.map((c) => {
        const s = getComputedStyle(c);
        return (
          c.offsetHeight +
          parseFloat(s.marginTop || "0") +
          parseFloat(s.marginBottom || "0")
        );
      });
      const types = blocks.map(
        (b) => b.getAttribute("data-block-type") || "row",
      );

      // Group blocks into A4 pages without splitting a block.
      const pages: number[][] = [];
      let cur: number[] = [];
      let curH = 0;
      for (let i = 0; i < blocks.length; i++) {
        const h = heights[i];
        // Avoid leaving a section heading orphaned at the bottom of a page.
        const isHeading = types[i] === "heading";
        const nextH = isHeading && i + 1 < blocks.length ? heights[i + 1] : 0;

        if (cur.length && curH + h + nextH > contentHpx) {
          pages.push(cur);
          cur = [];
          curH = 0;
        }
        cur.push(i);
        curH += h;
      }
      if (cur.length) pages.push(cur);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      pdf.setProperties({
        title: fileName.replace(/\.pdf$/i, ""),
        subject: "สมุดรายการวัสดุ",
      });
      const pdfW = pdf.internal.pageSize.getWidth();

      for (let p = 0; p < pages.length; p++) {
        const pageEl = document.createElement("div");
        pageEl.className = "text-slate-900";
        pageEl.style.cssText = `position:fixed;left:-99999px;top:0;width:${pageWpx}px;background:#fff;padding:${pagePadPx}px;box-sizing:border-box;`;
        for (const idx of pages[p]) {
          pageEl.appendChild(cloneBlockWithGraphics(blocks[idx]));
        }
        document.body.appendChild(pageEl);
        offscreen.push(pageEl);

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          width: pageEl.offsetWidth,
          height: pageEl.scrollHeight,
        });

        document.body.removeChild(pageEl);
        offscreen.pop();

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        const imgH = pdfW * (canvas.height / canvas.width);
        if (p > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, imgH);
      }

      const blob = pdf.output("blob");
      pdfBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error(err);
      setError("สร้าง PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      offscreen.forEach((el) => el.remove());
      setGenerating(false);
    }
  }

  function closePreview() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    pdfBlobRef.current = null;
    setPdfUrl(null);
  }

  async function handleDownload() {
    if (!pdfBlobRef.current) return;
    await downloadBlob(pdfBlobRef.current, fileName);
  }

  function handlePrint() {
    const frame = document.getElementById(
      "pdf-preview-frame",
    ) as HTMLIFrameElement | null;
    if (frame?.contentWindow) {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    }
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <BackButton className="mb-2" />
          <h1 className="text-2xl font-bold">สมุดรายการวัสดุ</h1>
          <p className="text-sm text-slate-500">
            ตัวอย่างก่อนพิมพ์ A4 — แผนก {department.name} ({itemCount} รายการ)
          </p>
        </div>
        {itemCount > 0 && (
          <Button type="button" onClick={handlePreview} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-1 h-4 w-4" />
            )}
            {generating ? "กำลังสร้าง PDF..." : "ดูตัวอย่าง PDF"}
          </Button>
        )}
      </div>

      {error && (
        <p className="no-print text-sm text-red-600">{error}</p>
      )}

      {itemCount === 0 ? (
        <Card className="no-print">
          <p className="text-sm text-slate-500">ยังไม่มีรายการในแผนก</p>
          <Link
            href="/dashboard/items"
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            ไปเพิ่มรายการในแผนก
          </Link>
        </Card>
      ) : (
        <div ref={previewRef}>
          <MaterialLedgerPreview
            departmentName={department.name}
            sections={sections}
            revisedAt={revisedAt}
            itemCount={itemCount}
          />
        </div>
      )}

      {pdfUrl && (
        <div
          className="no-print fixed inset-0 z-50 flex flex-col bg-slate-900/70 p-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h2 className="font-semibold text-slate-800">ตัวอย่าง PDF</h2>
                <p className="text-xs text-slate-500">{fileName}</p>
                <p className="text-xs text-slate-400">
                  ใช้ปุ่ม &quot;ดาวน์โหลด PDF&quot; ด้านล่างเพื่อบันทึกด้วยชื่อไฟล์นี้
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                title="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <iframe
              id="pdf-preview-frame"
              src={pdfUrl}
              title={fileName}
              className="min-h-0 flex-1 bg-slate-100"
            />

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <Button type="button" variant="secondary" onClick={closePreview}>
                ปิด
              </Button>
              <Button type="button" onClick={handleDownload}>
                <Download className="mr-1 h-4 w-4" />
                ดาวน์โหลด PDF
              </Button>
              <Button type="button" onClick={handlePrint}>
                <Printer className="mr-1 h-4 w-4" />
                พิมพ์
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
