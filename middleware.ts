import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth cookie on every request and guards admin
 * routes. Public pages still work without auth — only /admin and /api/admin
 * are blocked here. The /play, /profile, /results pages do their own
 * server-side redirect-to-login if needed.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          req.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          req.cookies.set({ name, value: "", ...options });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (isAdminRoute) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.is_admin) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse("Forbidden", { status: 403 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Skip Next internals and static files but include everything else so
    // session cookies stay fresh.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
