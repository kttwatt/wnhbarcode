"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackButton({
  className,
  fallbackHref = "/dashboard",
  showIcon = true,
}: {
  className?: string;
  fallbackHref?: string;
  showIcon?: boolean;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "inline-flex items-center gap-1 text-sm text-teal-700 hover:underline",
        className
      )}
    >
      {showIcon ? <ArrowLeft className="h-4 w-4" /> : "← "}
      กลับ
    </button>
  );
}
