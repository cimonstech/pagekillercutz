import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { decryptAdminSessionToken } from "@/lib/adminCookie";

async function verifyAdminCookie(
  cookieValue: string | undefined,
): Promise<{ email: string; role: "admin" | "super_admin" } | null> {
  if (!cookieValue) return null;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  const payload = await decryptAdminSessionToken(cookieValue, secret);
  if (!payload) return null;
  return { email: payload.email, role: payload.role };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // /admin/* (except login) — require verified signed admin session cookie.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminCookie = request.cookies.get("admin_session")?.value;
    const adminSession = await verifyAdminCookie(adminCookie);
    if (!adminSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const superAdminRoutes = ["/admin/accounts", "/admin/audit-log", "/admin/settings"];
    if (
      superAdminRoutes.some((route) => pathname.startsWith(route)) &&
      adminSession.role !== "super_admin"
    ) {
      return NextResponse.redirect(new URL("/admin/overview", request.url));
    }

    const adminResponse = NextResponse.next();
    adminResponse.headers.set("X-Frame-Options", "SAMEORIGIN");
    adminResponse.headers.set("X-Content-Type-Options", "nosniff");
    return adminResponse;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /client/* — require any authenticated session
  if (!user && pathname.startsWith("/client")) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set(
      "redirect",
      `${pathname}${request.nextUrl.search}`,
    );
    signIn.searchParams.set(
      "notice",
      "login_required",
    );
    return NextResponse.redirect(signIn);
  }

  supabaseResponse.headers.set("X-Frame-Options", "SAMEORIGIN");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};
