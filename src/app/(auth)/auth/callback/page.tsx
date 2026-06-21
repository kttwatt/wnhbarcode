import { Suspense } from "react";
import { AuthCallbackClient } from "./callback-client";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <p className="text-sm text-slate-600">กำลังเข้าสู่ระบบ...</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
