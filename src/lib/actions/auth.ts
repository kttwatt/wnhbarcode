"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string };

async function resolveAuthEmail(input: string): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const service = await createServiceClient();
  let profileQuery = service.from("profiles").select("id, email");

  if (trimmed.includes("@")) {
    profileQuery = profileQuery.eq("email", trimmed);
  } else {
    profileQuery = profileQuery.ilike("username", trimmed);
  }

  const { data: profile } = await profileQuery.single();
  if (!profile?.id) return null;

  const { data: authUser } = await service.auth.admin.getUserById(profile.id);
  return authUser?.user?.email || profile.email || null;
}

function authResetPasswordUrl(): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${origin}/auth/reset-password`;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };
  }

  const service = await createServiceClient();
  let profileQuery = service.from("profiles").select("id, email");

  if (username.includes("@")) {
    profileQuery = profileQuery.eq("email", username);
  } else {
    profileQuery = profileQuery.ilike("username", username);
  }

  const { data: profile, error: profileError } = await profileQuery.single();

  if (!profile?.id) {
    console.error("[login] profile not found for:", username, profileError?.message);
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  const { data: authUser, error: authUserError } =
    await service.auth.admin.getUserById(profile.id);

  if (authUserError) {
    console.error("[login] getUserById error:", authUserError.message, "uuid:", profile.id);
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  const email = authUser?.user?.email || profile.email;
  if (!email) {
    console.error("[login] no email found for uuid:", profile.id);
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  console.log("[login] signing in with email:", email);

  if (email !== profile.email) {
    await service
      .from("profiles")
      .update({ email })
      .eq("id", profile.id);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[login] signInWithPassword error:", error.message, "email:", email);
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const input = String(formData.get("identifier") || "").trim();
  if (!input) {
    return { error: "กรุณากรอกชื่อผู้ใช้หรืออีเมล" };
  }

  const email = await resolveAuthEmail(input);

  if (email) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authResetPasswordUrl(),
    });
  }

  return {
    success:
      "ถ้ามีบัญชีนี้ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมล",
  };
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }
  if (password !== confirm) {
    return { error: "รหัสผ่านไม่ตรงกัน" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  redirect("/login");
}

export async function changePasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const currentPassword = String(formData.get("current_password") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!currentPassword || !password || !confirm) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }
  if (password.length < 6) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" };
  }
  if (password === currentPassword) {
    return { error: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสปัจจุบัน" };
  }
  if (password !== confirm) {
    return { error: "รหัสผ่านใหม่ไม่ตรงกัน" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "ไม่พบบัญชีผู้ใช้" };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  return { success: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" };
}
