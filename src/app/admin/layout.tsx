import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRealProfile } from "@/lib/auth/session";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminNav } from "@/components/admin/admin-nav";
import { BackButton } from "@/components/back-button";
import { UserMenu } from "@/components/user-menu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getRealProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar isAdmin />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <p className="text-sm font-medium text-slate-800">
              {profile.full_name || profile.username}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BackButton showIcon={false} />
            <UserMenu
              username={profile.username}
              fullName={profile.full_name}
              settingsProfile={{
                username: profile.username,
                email: profile.email,
                full_name: profile.full_name,
              }}
            />
          </div>
        </header>
        <div className="border-b border-slate-200 bg-white px-5">
          <Suspense fallback={null}>
            <AdminNav />
          </Suspense>
        </div>
        <main className="flex-1 overflow-auto p-5">{children}</main>
      </div>
    </div>
  );
}
