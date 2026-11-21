import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Paths (locale prefix already stripped) that don't require a signed-in user.
const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

function isRedirect(response: NextResponse) {
  return response.headers.has("location");
}

function stripLocale(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    return "/" + segments.slice(2).join("/") || "/";
  }
  return pathname;
}

export default async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  // next-intl is redirecting to add/fix the locale prefix — no auth check yet,
  // the follow-up request will hit this proxy again with a resolved locale.
  if (isRedirect(intlResponse)) {
    return intlResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            intlResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const pathname = request.nextUrl.pathname;
  const locale = pathname.split("/")[1] || routing.defaultLocale;
  const pathWithoutLocale = stripLocale(pathname);
  const isPublicPath = PUBLIC_PATHS.has(pathWithoutLocale);

  if (!user && !isPublicPath) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathWithoutLocale);
    const redirectResponse = NextResponse.redirect(loginUrl);
    intlResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (user && (pathWithoutLocale === "/login" || pathWithoutLocale === "/signup")) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    intlResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
