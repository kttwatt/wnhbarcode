"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveDepartmentAction } from "@/lib/actions/department-switch";
import { Select } from "@/components/ui/primitives";
import type { Department } from "@/lib/types";

export function DepartmentSwitcher({
  departments,
  activeDepartmentId,
}: {
  departments: Department[];
  activeDepartmentId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const active = departments.find((d) => d.id === activeDepartmentId);

  if (departments.length <= 1) {
    return (
      <div>
        <p className="text-sm text-slate-500">แผนก</p>
        <p className="font-medium">{active?.name || departments[0]?.name || "—"}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500">แผนก</p>
      <Select
        value={activeDepartmentId || ""}
        disabled={pending}
        onChange={(e) => {
          const nextId = e.target.value;
          startTransition(async () => {
            await setActiveDepartmentAction(nextId);
            router.refresh();
          });
        }}
        className="mt-0.5 w-auto min-w-[8rem] border-slate-200 py-1 pl-2 pr-8 text-sm font-medium"
      >
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
