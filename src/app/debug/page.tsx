import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getI18n } from "@/i18n/server";

export default async function DebugPage() {
  const { t } = await getI18n();
  const supabase = await createSupabaseServerClient();

  // 1) Tailwind test: si ves caja verde, tailwind está ok
  const twOk = true;

  // 2) Sesión SSR
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  // 3) Query simple a movies (RLS: pública en SELECT)
  const { data: movies, error: moviesErr } = await supabase
    .from("movies")
    .select("id, title")
    .limit(3);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <h1 className="text-2xl font-bold text-[#f0a500]">Debug</h1>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold mb-2">Tailwind</h2>
        <div className="text-white/80 text-sm mb-2">
          {t("debugTailwindHelp")}
        </div>
        <div className="h-8 w-full rounded bg-[#22c55e]" />
        <p className="mt-2 text-sm text-white/60">
          {twOk ? "Tailwind OK" : t("tailwindMissing")}
        </p>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold mb-2">Auth (SSR)</h2>
        {userErr && (
          <pre className="text-red-400 text-xs">{userErr.message}</pre>
        )}
        {user ? (
          <p className="text-white/80 text-sm">{t("user", { email: user.email ?? "" })}</p>
        ) : (
          <p className="text-white/60 text-sm">{t("signedOut")}</p>
        )}
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold mb-2">Supabase: SELECT movies</h2>
        {moviesErr && (
          <pre className="text-red-400 text-xs whitespace-pre-wrap">
            {JSON.stringify(moviesErr, null, 2)}
          </pre>
        )}
        <pre className="text-xs whitespace-pre-wrap text-white/80">
          {JSON.stringify(movies ?? [], null, 2)}
        </pre>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold mb-2">{t("envCheck")}</h2>
        <p className="text-white/60 text-sm">
          {t("envHelp")}
        </p>
        <pre className="text-xs text-white/70 bg-black/40 p-2 rounded">
          {`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Opcional server-only
SUPABASE_SERVICE_ROLE_KEY=...`}
        </pre>
      </section>
    </div>
  );
}
