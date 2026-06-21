"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { BarcodePreview } from "@/components/barcode-preview";
import { getItemUnit } from "@/lib/actions/item-lookup";
import {
  confirmMultipleScanSuccess,
  confirmScanSuccess,
} from "@/lib/actions/scan-log";
import { Button, Card } from "@/components/ui/primitives";

export type ScanQueueItem = {
  id: string;
  code: string;
  name: string;
  barcode: string;
  unit: string;
  qty?: number;
  prescanId?: string;
};

export function ScanPanel({
  item,
  onClose,
  onComplete,
  onNext,
  onPrev,
  index = 0,
  total = 1,
  queueItems,
  variant = "inline",
  onConfirm,
}: {
  item: ScanQueueItem;
  onClose: () => void;
  onComplete?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  index?: number;
  total?: number;
  queueItems?: ScanQueueItem[];
  variant?: "inline" | "modal";
  /** Override the default scan-log insert (used by the prescan flow). */
  onConfirm?: () => Promise<{ error?: string } | { success?: boolean } | void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [unit, setUnit] = useState(item.unit);

  useEffect(() => {
    setUnit(item.unit);
    let cancelled = false;

    void getItemUnit(item.id).then((result) => {
      if (cancelled || result.error) return;
      setUnit(result.unit);
    });

    return () => {
      cancelled = true;
    };
  }, [item.id, item.unit]);

  const isQueue = total > 1;
  const isLast = index === total - 1;
  const canGoBack = isQueue && index > 0 && Boolean(onPrev);

  const finish = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  const handleConfirm = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError("");

    const result = onConfirm
      ? (await onConfirm()) ?? {}
      : isQueue && queueItems
        ? await confirmMultipleScanSuccess(
            queueItems.map((entry) => ({
              id: entry.id,
              barcode: entry.barcode,
              qty: entry.qty ?? 1,
            }))
          )
        : await confirmScanSuccess(item.id, item.barcode);

    setBusy(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setTimeout(finish, 600);
  }, [item, busy, finish, isQueue, queueItems, onConfirm]);

  const panel = (
    <Card className="border-teal-200 bg-white">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">สแกนบาร์โค้ด</h2>
          <p className="text-sm text-slate-500">
            {isQueue && !isLast
              ? "สแกนใน IPISS แล้วกด รายการถัดไป"
              : "สแกนใน IPISS แล้วกด สแกนสำเร็จ เพื่อบันทึก"}
            {isQueue && (
              <span className="ml-2 font-medium text-teal-700">
                {index + 1} / {total}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          ปิด
        </button>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="font-medium">{item.name}</div>
        <div className="mb-3 text-sm text-slate-600">
          รหัส: {item.code} | หน่วย: {unit || "—"}
        </div>
        {item.qty && item.qty > 1 && (
          <p className="mb-3 rounded-md bg-teal-50 px-3 py-1.5 text-sm text-teal-800">
            จำนวนที่ใช้: {item.qty}
          </p>
        )}
        <BarcodePreview value={item.barcode} className="mx-auto max-w-full" />
      </div>

      {success && (
        <p className="mb-3 flex items-center gap-1 text-sm text-teal-700">
          <CheckCircle2 className="h-4 w-4" />
          บันทึกแล้ว
        </p>
      )}

      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-center gap-2">
        {canGoBack && (
          <Button type="button" variant="secondary" disabled={busy} onClick={onPrev}>
            ย้อนกลับ
          </Button>
        )}
        {isQueue && !isLast ? (
          <Button type="button" disabled={busy} onClick={onNext}>
            รายการถัดไป
          </Button>
        ) : (
          <Button
            type="button"
            disabled={busy || success}
            onClick={() => void handleConfirm()}
          >
            สแกนสำเร็จ
          </Button>
        )}
      </div>
    </Card>
  );

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md">{panel}</div>
      </div>
    );
  }

  return panel;
}
