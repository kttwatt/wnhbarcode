"use client";

import { useTransition } from "react";
import { Star } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/user-favorites";
import { cn } from "@/lib/utils";

export function FavoriteStarButton({
  itemId,
  active,
}: {
  itemId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title="รายการโปรด"
      aria-label={active ? "ลบออกจากรายการโปรด" : "เพิ่มรายการโปรด"}
      className={cn(
        "rounded p-1 hover:bg-amber-50",
        active ? "text-amber-500" : "text-slate-300"
      )}
      onClick={() => {
        startTransition(async () => {
          await toggleFavorite(itemId);
        });
      }}
    >
      <Star className="h-5 w-5" fill={active ? "currentColor" : "none"} />
    </button>
  );
}
