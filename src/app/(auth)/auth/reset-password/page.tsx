import { Suspense } from "react";
import { ResetPasswordPageClient } from "./reset-password-page-client";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <p className="text-sm text-slate-600">กำลังเตรียมหน้าตั้งรหัสผ่าน...</p>
        </div>
      }
    >
      <ResetPasswordPageClient />
    </Suspense>
  );
}
