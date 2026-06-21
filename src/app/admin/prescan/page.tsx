import { getAdminDepartmentsForFilter } from "@/lib/data/scan-logs";
import { PRESCAN_STALE_HOURS, getAdminPrescanItems } from "@/lib/data/prescan";
import { AdminPrescanClient } from "./admin-prescan-client";

type PrescanStatusFilter = "pending" | "scanned" | "cancelled";

type Props = {
  searchParams: Promise<{ department?: string; status?: string }>;
};

export default async function AdminPrescanPage({ searchParams }: Props) {
  const params = await searchParams;
  const departmentId = params.department?.trim() || "";
  const status: PrescanStatusFilter =
    params.status === "scanned" || params.status === "cancelled"
      ? params.status
      : "pending";

  const [{ items, error }, { departments, error: deptError }] =
    await Promise.all([
      getAdminPrescanItems({
        departmentId: departmentId || undefined,
        status,
      }),
      getAdminDepartmentsForFilter(),
    ]);

  return (
    <AdminPrescanClient
      items={items}
      departments={departments}
      departmentId={departmentId}
      status={status}
      staleHours={PRESCAN_STALE_HOURS}
      error={error || deptError}
    />
  );
}
