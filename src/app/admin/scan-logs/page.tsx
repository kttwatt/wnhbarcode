import {
  getAdminDepartmentsForFilter,
  getAdminScanLogs,
} from "@/lib/data/scan-logs";
import { ScanLogsClient } from "./scan-logs-client";

type Props = {
  searchParams: Promise<{
    department?: string;
    q?: string;
    source?: string;
    days?: string;
    page?: string;
  }>;
};

function sinceFromDays(days: string | undefined): string | undefined {
  const n = Number(days);
  if (!n || Number.isNaN(n)) return undefined;
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminScanLogsPage({ searchParams }: Props) {
  const params = await searchParams;
  const departmentId = params.department?.trim() || "";
  const search = params.q?.trim() || "";
  const source = params.source?.trim() || "";
  const days = params.days?.trim() || "7";
  const page = Math.max(0, Number(params.page) || 0);

  const [
    { logs, error: logsError, hasMore },
    { departments, error: deptError },
  ] = await Promise.all([
    getAdminScanLogs({
      departmentId: departmentId || undefined,
      search: search || undefined,
      source: source || undefined,
      since: sinceFromDays(days),
      page,
    }),
    getAdminDepartmentsForFilter(),
  ]);

  return (
    <ScanLogsClient
      logs={logs}
      departments={departments}
      departmentId={departmentId}
      search={search}
      source={source}
      days={days}
      page={page}
      hasMore={hasMore}
      error={logsError || deptError}
    />
  );
}
