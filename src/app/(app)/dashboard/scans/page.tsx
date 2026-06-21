import { redirect } from "next/navigation";
import { getActiveDepartmentId, getCurrentProfile } from "@/lib/auth/session";
import { getDepartmentScanLogs } from "@/lib/data/scan-logs";
import { DepartmentScansClient } from "./scans-client";

export default async function DepartmentScansPage() {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile) redirect("/login");
  if (!departmentId) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { logs, error } = await getDepartmentScanLogs(departmentId, {
    since: today.toISOString(),
  });

  return (
    <DepartmentScansClient
      logs={logs}
      error={error}
      title="สแกนวันนี้"
      description={`${logs.length} รายการที่บันทึกแล้วในแผนกของคุณ`}
    />
  );
}
