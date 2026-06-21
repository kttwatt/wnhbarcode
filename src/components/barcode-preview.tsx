"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function BarcodePreview({
  value,
  className,
  displayValue = true,
  height = 60,
}: {
  value: string;
  className?: string;
  displayValue?: boolean;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    try {
      JsBarcode(canvas, value, {
        format: "CODE128",
        width: 2,
        height,
        displayValue,
        fontSize: 14,
        margin: 8,
      });
    } catch {
      // ignore invalid barcode
    }
  }, [value, displayValue, height]);

  if (!value) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}
