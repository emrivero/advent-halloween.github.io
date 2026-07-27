// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // if (debug) {
  //   const res = NextResponse.next();
  //   // cookie sólo en dev
  //   if (process.env.NODE_ENV !== "production") {
  //     res.cookies.set("x-debug-today", debug, { path: "/", httpOnly: false });
  //   }
  //   // limpia el query param visualmente
  //   url.searchParams.delete("debugDate");
  //   res.headers.set("location", url.toString());
  //   return NextResponse.redirect(url);
  // }

  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          req.cookies.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cookies) => {
          for (const { name, value, ...options } of cookies) {
            res.cookies.set({ name, value, ...options });
          }
        },
      },
    }
  );

  // Esto refresca token si toca y asegura cookies válidas
  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: [
    "/((?!api|share|auth/callback|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|woff|woff2|otf|ttf)$).*)",
  ],
};
