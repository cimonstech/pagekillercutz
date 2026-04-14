import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: adminRecord } = await admin
      .from("admins")
      .select("role, status, email")
      .ilike("email", user.email ?? "")
      .maybeSingle();

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name as string | undefined,
      },
      admin: adminRecord ?? null,
    });
  } catch {
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
