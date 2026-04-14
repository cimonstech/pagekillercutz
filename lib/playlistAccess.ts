import { getSupabaseAdmin } from "@/lib/supabase";

export function emailsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Active admin or super_admin in the admins table. */
export async function isActiveStaffAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email?.trim()) return false;
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("admins")
    .select("role, status")
    .ilike("email", email.trim())
    .maybeSingle();
  return !!(
    data &&
    data.status === "active" &&
    (data.role === "admin" || data.role === "super_admin")
  );
}
