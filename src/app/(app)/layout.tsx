import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { DepartmentSwitcher } from "@/components/department-switcher";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { UserMenu } from "@/components/user-menu";
import {
  getAccessibleDepartments,
  getActiveDepartmentId,
  getCurrentProfile,
  getRealProfile,
  isImpersonating,
} from "@/lib/auth/session";
import { getPrescanPendingCount } from "@/lib/data/prescan";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const realProfile = await getRealProfile();
  if (!profile || !realProfile) redirect("/login");

  const impersonating = await isImpersonating();
  const departments = await getAccessibleDepartments(profile);
  const activeDepartmentId = await getActiveDepartmentId();
  const hasDepartment =
    Boolean(activeDepartmentId) ||
    departments.length > 0 ||
    Boolean(profile.department_id);
  const prescanCount = activeDepartmentId
    ? await getPrescanPendingCount(activeDepartmentId)
    : 0;

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        isAdmin={profile.role === "admin"}
        prescanCount={prescanCount}
      />
      <div className="flex flex-1 flex-col">
        {impersonating && (
          <ImpersonationBanner
            username={profile.username}
            fullName={profile.full_name}
          />
        )}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <DepartmentSwitcher
            departments={departments}
            activeDepartmentId={activeDepartmentId}
          />
          <UserMenu
            username={profile.username}
            fullName={profile.full_name}
            settingsProfile={{
              username: realProfile.username,
              email: realProfile.email,
              full_name: realProfile.full_name,
            }}
          />
        </header>
        <main className="flex-1 overflow-auto p-6">
          {!hasDepartment ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
              <p className="font-medium">ยังไม่ได้กำหนดแผนก</p>
              <p className="mt-1">
                บัญชีนี้ยังไม่มีแผนกที่เข้าถึงได้ กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
