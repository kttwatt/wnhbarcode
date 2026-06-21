import { getAdminDepartmentsForFilter } from "@/lib/data/scan-logs";
import { getAuditLogs, getDistinctAuditActions } from "@/lib/data/audit-logs";
import { AuditClient } from "./audit-client";

type Props = {
  searchParams: Promise<{ department?: string; action?: string; days?: string }>;
};

function sinceFromDays(days: string | undefined): string | undefined {
  const n = Number(days);
  if (!n || Number.isNaN(n)) return undefined;
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminAuditPage({ searchParams }: Props) {
  const params = await searchParams;
  const departmentId = params.department?.trim() || "";
  const action = params.action?.trim() || "";
  const days = params.days?.trim() || "7";

  const [{ logs, error }, { departments, error: deptError }, actions] =
    await Promise.all([
      getAuditLogs({
        departmentId: departmentId || undefined,
        action: action || undefined,
        since: sinceFromDays(days),
      }),
      getAdminDepartmentsForFilter(),
      getDistinctAuditActions(),
    ]);

  return (
    <AuditClient
      logs={logs}
      departments={departments}
      actions={actions}
      departmentId={departmentId}
      action={action}
      days={days}
      error={error || deptError}
    />
  );
}
