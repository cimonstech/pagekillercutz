import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export type AdminAuthOk = {
  authorized: true;
  email: string;
  role: "admin" | "super_admin";
};

export type AdminAuthFail = {
  authorized: false;
  errorResponse: Response;
};

export async function requireAdmin(): Promise<AdminAuthOk | AdminAuthFail> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return {
        authorized: false,
        errorResponse: Response.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const admin = getSupabaseAdmin();
    const { data: adminRecord, error } = await admin
      .from("admins")
      .select("role, status")
      .ilike("email", user.email)
      .maybeSingle();

    if (error) {
      return {
        authorized: false,
        errorResponse: Response.json({ error: "Auth check failed" }, { status: 500 }),
      };
    }

    if (
      !adminRecord ||
      adminRecord.status !== "active" ||
      (adminRecord.role !== "admin" && adminRecord.role !== "super_admin")
    ) {
      return {
        authorized: false,
        errorResponse: Response.json({ error: "Forbidden" }, { status: 403 }),
      };
    }

    return {
      authorized: true,
      email: user.email,
      role: adminRecord.role as "admin" | "super_admin",
    };
  } catch {
    return {
      authorized: false,
      errorResponse: Response.json({ error: "Auth check failed" }, { status: 500 }),
    };
  }
}

export async function requireSuperAdmin(): Promise<AdminAuthOk | AdminAuthFail> {
  const result = await requireAdmin();
  if (!result.authorized) return result;
  if (result.role !== "super_admin") {
    return {
      authorized: false,
      errorResponse: Response.json({ error: "Super admin required" }, { status: 403 }),
    };
  }
  return result;
}
