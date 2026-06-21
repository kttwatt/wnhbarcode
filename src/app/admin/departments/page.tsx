import { redirect } from "next/navigation";

export default function AdminDepartmentsRedirect() {
  redirect("/admin/org");
}
