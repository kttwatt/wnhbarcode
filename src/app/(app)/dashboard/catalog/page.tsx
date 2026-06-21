import { redirect } from "next/navigation";
import {
  getActiveDepartment,
  getActiveDepartmentId,
  getCurrentProfile,
} from "@/lib/auth/session";
import { getDepartmentCatalog } from "@/lib/data/department-catalog";
import { MaterialLedgerClient } from "./catalog-client";

export default async function CatalogPage() {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile) redirect("/login");
  if (!departmentId) return null;

  const [department, { sections, items, revisedAt }] = await Promise.all([
    getActiveDepartment(),
    getDepartmentCatalog(departmentId),
  ]);

  return (
    <MaterialLedgerClient
      department={{
        id: departmentId,
        name: department?.name ?? "—",
        code: department?.code ?? null,
      }}
      sections={sections}
      revisedAt={revisedAt}
      itemCount={items.length}
    />
  );
}
