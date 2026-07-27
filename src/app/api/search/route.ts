import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildPosterUrl, normalizeQuery, SEARCH_TTL_MS } from "@/lib/tmdb";
import { NextResponse } from "next/server";
import { allowRequest } from "@/lib/rate-limit";
import { localeFromRequest, translate } from "@/i18n/config";

const TMDB_URL = "https://api.themoviedb.org/3";

export async function GET(req: Request) {
  try {
    const locale = localeFromRequest(req);
    if (!allowRequest(req, "search"))
      return NextResponse.json({ error: translate(locale, "tooManyRequests") }, { status: 429 });
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (!q) return NextResponse.json({ results: [] });
    if (q.length > 120)
      return NextResponse.json({ error: translate(locale, "searchTooLong") }, { status: 400 });

    const nq = normalizeQuery(q);

    const supabase = await createSupabaseServerClient();

    // 1) Cache hit?
    const { data: cache } = await supabase
      .from("search_cache")
      .select("results, updated_at")
      .eq("q_normalized", nq)
      .maybeSingle();

    const now = Date.now();
    if (cache?.results && cache?.updated_at) {
      const age = now - new Date(cache.updated_at).getTime();
      if (age < SEARCH_TTL_MS) {
        return NextResponse.json({ results: cache.results });
      }
    }

    // 2) Fetch TMDB
    const key = process.env.TMDB_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: translate(locale, "tmdbMissing") },
        { status: 500 }
      );
    }

    const url = `${TMDB_URL}/search/movie?query=${encodeURIComponent(
      q
    )}&language=es-ES&include_adult=false&page=1`;
    const isV4 = key.startsWith("ey");
    const requestUrl = isV4 ? url : `${url}&api_key=${encodeURIComponent(key)}`;
    const r = await fetch(requestUrl, {
      headers: {
        ...(isV4 ? { Authorization: `Bearer ${key}` } : {}),
        accept: "application/json",
      },
    });

    // Nota: TMDB acepta API key como query param ?api_key=... o Bearer v4; soportamos ambas:
    const ok = r.ok;
    const data = ok ? await r.json() : null;
    if (!ok || !data) {
      const t = await r.text();
      return NextResponse.json(
        { error: `TMDB search error: ${t}` },
        { status: r.status }
      );
    }

    const results = mapSearchResults(data);
    await upsertSearchCache(nq, results);
    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Search error" },
      { status: 500 }
    );
  }
}

function mapSearchResults(data: any) {
  const list = Array.isArray(data?.results) ? data.results : [];
  return list.slice(0, 10).map((m: any) => ({
    tmdb_id: m?.id ?? null,
    title: m?.title ?? m?.name ?? "",
    year: (m?.release_date || "").slice(0, 4) || null,
    release_date: m?.release_date ?? null,
    poster_url: buildPosterUrl(m?.poster_path) ?? null,
    overview: m?.overview ?? "",
    vote_average: m?.vote_average ?? null,
  }));
}

// upsert en caché (sin RLS)
async function upsertSearchCache(nq: string, results: any[]) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase
      .from("search_cache")
      .upsert({
        q_normalized: nq,
        results,
        updated_at: new Date().toISOString(),
      })
      .select()
      .limit(1);
  } catch {
    /* ignore cache errors */
  }
}
