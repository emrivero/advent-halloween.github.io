import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CatalogClient from "./CatalogClient";
import { getI18n } from "@/i18n/server";

export default async function CatalogPage() {
  const { t } = await getI18n();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Catálogo global (public select por RLS)
  const { data: movies } = await supabase
    .from("movies")
    .select("id, title, year, poster_url, runtime_min, tags")
    .order("year", { ascending: false });

  // Preferencias del usuario
  const { data: prefs } = await supabase
    .from("user_catalog")
    .select("movie_id, allowed")
    .eq("user_id", user.id);

  const allowedMap = new Map<string, boolean>(
    (prefs ?? []).map((p) => [p.movie_id, p.allowed])
  );

  const initial = (movies ?? []).map((m) => ({
    id: m.id as string,
    title: m.title as string,
    year: m.year as number | null,
    poster_url: m.poster_url as string | null,
    runtime_min: m.runtime_min as number | null,
    tags: (m.tags ?? []) as string[],
    allowed: allowedMap.get(m.id as string) ?? true, // por defecto allowed
  }));

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-[#f0a500]">{t("catalog")}</h1>
      <p className="text-white/70 mt-1">
        {t("catalogIntro")}
      </p>
      <CatalogClient initialMovies={initial} />
    </div>
  );
}
