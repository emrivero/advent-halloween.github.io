import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildPosterUrl, MOVIE_TTL_MS } from "@/lib/tmdb";
import { NextResponse } from "next/server";
import { allowRequest } from "@/lib/rate-limit";

const TMDB_URL = "https://api.themoviedb.org/3";

export async function GET(req: Request) {
  try {
    if (!allowRequest(req, "movie"))
      return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
    const { searchParams } = new URL(req.url);
    const tmdbRaw = searchParams.get("tmdb");
    const imdbRaw = searchParams.get("imdb");
    const titleRaw = searchParams.get("title");
    const yearRaw = searchParams.get("year");
    if (
      (imdbRaw && !/^tt\d{5,12}$/.test(imdbRaw)) ||
      (titleRaw && (titleRaw.trim().length === 0 || titleRaw.length > 300)) ||
      (yearRaw && !/^\d{4}$/.test(yearRaw))
    )
      return NextResponse.json({ error: "Parámetros no válidos" }, { status: 400 });

    const key = process.env.TMDB_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "TMDB_API_KEY missing" },
        { status: 500 }
      );
    }

    // 1) Resolver TMDB id
    let tmdb_id: number | null = tmdbRaw ? Number(tmdbRaw) : null;
    if (
      tmdbRaw &&
      (!Number.isSafeInteger(tmdb_id) || (tmdb_id as number) <= 0)
    )
      return NextResponse.json({ error: "tmdb_id no válido" }, { status: 400 });

    if (!tmdb_id && imdbRaw) {
      // /find/{imdb_id}?external_source=imdb_id
      const r = await fetchWithKey(
        `${TMDB_URL}/find/${encodeURIComponent(
          imdbRaw
        )}?external_source=imdb_id&language=es-ES`,
        key
      );
      if (r.ok) {
        const j = await r.json();
        tmdb_id = j?.movie_results?.[0]?.id ?? null;
      }
    }

    if (!tmdb_id && titleRaw) {
      const q = new URLSearchParams({
        query: titleRaw,
        language: "es-ES",
        include_adult: "false",
        page: "1",
      });
      const r = await fetchWithKey(
        `${TMDB_URL}/search/movie?${q.toString()}`,
        key
      );
      if (r.ok) {
        const j = await r.json();
        const first = pickByYear(j?.results ?? [], yearRaw);
        tmdb_id = first?.id ?? null;
      }
    }

    if (!tmdb_id) {
      return NextResponse.json(
        { error: "No se pudo resolver tmdb_id" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // 2) Cache hit?
    const { data: cache } = await supabase
      .from("movies_cache")
      .select("*")
      .eq("tmdb_id", tmdb_id)
      .maybeSingle();

    const now = Date.now();
    if (cache?.updated_at) {
      const age = now - new Date(cache.updated_at).getTime();
      if (age < MOVIE_TTL_MS) {
        return NextResponse.json(toPayload(cache));
      }
    }

    // 3) Fetch detalle TMDB
    const r = await fetchWithKey(
      `${TMDB_URL}/movie/${tmdb_id}?language=es-ES`,
      key
    );
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json(
        { error: `TMDB detail error: ${t}` },
        { status: r.status }
      );
    }
    const d = await r.json();

    // Map a nuestro modelo
    const mapped = {
      tmdb_id,
      imdb_id: d?.imdb_id ?? null,
      title_es: d?.title ?? "",
      overview_es: d?.overview ?? "",
      poster_path: d?.poster_path ?? null,
      release_date: d?.release_date ? d.release_date : null,
      runtime_min: d?.runtime ?? null,
      genres_es: Array.isArray(d?.genres)
        ? d.genres.map((g: any) => g?.name).filter(Boolean)
        : [],
      raw: d,
      updated_at: new Date().toISOString(),
    };

    // 4) Upsert caché
    try {
      await supabase.from("movies_cache").upsert(mapped).select().limit(1);
    } catch {
      /* ignore cache errors */
    }

    return NextResponse.json(toPayload(mapped));
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Movie detail error" },
      { status: 500 }
    );
  }
}

function toPayload(row: any) {
  return {
    tmdb_id: row.tmdb_id,
    imdb: row.imdb_id ?? null,
    title: row.title_es,
    year: row.release_date ? String(row.release_date).slice(0, 4) : null,
    overview: row.overview_es ?? "",
    runtime_min: row.runtime_min ?? null,
    genres: row.genres_es ?? [],
    released: row.release_date ?? null,
    poster_url: buildPosterUrl(row.poster_path) ?? null,
  };
}

function pickByYear(results: any[], yearRaw: string | null) {
  if (!Array.isArray(results) || results.length === 0) return null;
  if (yearRaw) {
    const y = Number(yearRaw);
    const byYear = results.find((m: any) =>
      (m?.release_date || "").startsWith(String(y))
    );
    if (byYear) return byYear;
  }
  return results[0];
}

async function fetchWithKey(url: string, key: string) {
  const isV4 = key.startsWith("ey"); // TMDB v4 token (JWT-like)
  if (isV4) {
    return fetch(url, {
      headers: { accept: "application/json", Authorization: `Bearer ${key}` },
    });
  }
  // v3 api key
  const sep = url.includes("?") ? "&" : "?";
  return fetch(`${url}${sep}api_key=${key}`, {
    headers: { accept: "application/json" },
  });
}
