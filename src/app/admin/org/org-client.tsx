"use client";

import { DepartmentsClient } from "@/app/admin/departments/departments-client";
import { UsersClient } from "@/app/admin/users/users-client";
import type { Department, Profile } from "@/lib/types";

export function OrgClient({
  departments,
  users,
  userDepartmentMap,
  currentAdminId,
}: {
  departments: Department[];
  users: Profile[];
  userDepartmentMap: Record<string, string[]>;
  currentAdminId: string | null;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section>
        <DepartmentsClient departments={departments} compact />
      </section>
      <section>
        <UsersClient
          users={users}
          departments={departments.filter((d) => !d.deleted_at)}
          userDepartmentMap={userDepartmentMap}
          currentAdminId={currentAdminId}
          compact
        />
      </section>
    </div>
  );
}
