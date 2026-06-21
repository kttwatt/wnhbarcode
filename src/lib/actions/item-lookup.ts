"use server";

import { createClient } from "@/lib/supabase/server";

export async function getItemUnit(itemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select("unit")
    .eq("id", itemId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return { error: error.message };
  return { unit: data?.unit ?? "" };
}
