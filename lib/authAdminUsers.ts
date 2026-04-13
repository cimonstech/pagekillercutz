import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/** Find a Supabase Auth user by email (paginated search). */
export async function findAuthUserByEmail(
  admin: SupabaseClient<Database>,
  email: string,
): Promise<User | null> {
  const target = email.toLowerCase().trim();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === target);
    if (u) return u;
    if (data.users.length < 1000) break;
  }
  return null;
}
