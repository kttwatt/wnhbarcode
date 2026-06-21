import { redirect } from "next/navigation";
import {
  getActiveDepartmentId,
  getCurrentProfile,
} from "@/lib/auth/session";
import {
  PRESCAN_STALE_HOURS,
  getPrescanHistory,
  getPrescanItems,
  searchDepartmentItems,
} from "@/lib/data/prescan";
import { PrescanClient } from "./prescan-client";

export default async function PrescanPage() {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile) redirect("/login");
  if (!departmentId) return null;

  const [pending, history, initialSearch] = await Promise.all([
    getPrescanItems(departmentId),
    getPrescanHistory(departmentId),
    searchDepartmentItems(departmentId, "", 0),
  ]);

  return (
    <PrescanClient
      key={departmentId}
      departmentId={departmentId}
      pending={pending}
      history={history}
      initialResults={initialSearch.items}
      staleHours={PRESCAN_STALE_HOURS}
    />
  );
}
