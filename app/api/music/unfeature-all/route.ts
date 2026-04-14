import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("music").update({ featured: false }).eq("featured", true);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
