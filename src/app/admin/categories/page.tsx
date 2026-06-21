import { redirect } from "next/navigation";

export default function AdminCategoriesRedirect() {
  redirect("/admin/items?panel=categories");
}
