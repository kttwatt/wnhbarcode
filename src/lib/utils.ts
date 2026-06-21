import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateTh(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export type DepartmentExportInfo = {
  name: string;
  code: string | null;
};

export function departmentExportLabel(department: DepartmentExportInfo) {
  const label = department.name.trim();
  return label.replace(/[\\/:*?"<>|]/g, "-") || "unknown";
}

export function catalogPdfFileName(department: DepartmentExportInfo) {
  return `สมุดรายการวัสดุ-${departmentExportLabel(department)}.pdf`;
}
