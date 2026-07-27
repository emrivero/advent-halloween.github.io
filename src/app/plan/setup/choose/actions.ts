// src/app/plan/setup/choose/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  interleaveBlocks,
  isUuid,
  normalizePlanDays,
  shuffleInPlace,
} from "@/lib/plan";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type SelectedMovie = {
  id?: string;
  imdb_id?: string | null;
  tmdb_id?: number | null;
  title: string;
  poster_url?: string | null;
  tags?: string[] | null;
  isCustom?: boolean;
  sagaKey?: string;
  sagaOrder?: number;
  isSaga?: boolean;
};

export async function createPlanFromSelectionAction(input: {
  name: string;
  days: string[]; // 'YYYY-MM-DD' ya ordenados
  movies: SelectedMovie[]; // misma longitud que days
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const name = input.name.trim().slice(0, 120) || "Mi plan";
  const days = normalizePlanDays(input.days);
  const movies = input.movies;
  if (movies.length !== days.length)
    throw new Error("El nº de películas debe igualar el nº de días");
  if (
    movies.some(
      (movie) =>
        !movie.title?.trim() ||
        movie.title.length > 300 ||
        (movie.tmdb_id != null &&
          (!Number.isSafeInteger(movie.tmdb_id) || movie.tmdb_id <= 0)) ||
        (movie.imdb_id != null && !/^tt\d{5,12}$/.test(movie.imdb_id))
    )
  )
    throw new Error("Hay películas con datos no válidos");

  // 1) Clasifica indices
  const internalIdx: number[] = [];
  const externalIdx: number[] = [];
  const looseIdx: number[] = [];

  movies.forEach((m, i) => {
    if (m.id && isUuid(m.id)) internalIdx.push(i);
    else if (m.tmdb_id || m.imdb_id) externalIdx.push(i);
    else looseIdx.push(i);
  });

  // 2) Busca existentes por externos
  const extTmdb = Array.from(
    new Set(
      externalIdx.map((i) => movies[i].tmdb_id).filter((x): x is number => !!x)
    )
  );
  const extImdb = Array.from(
    new Set(
      externalIdx.map((i) => movies[i].imdb_id).filter((x): x is string => !!x)
    )
  );

  const foundByTmdb = extTmdb.length
    ? await supabase.from("movies").select("id, tmdb_id").in("tmdb_id", extTmdb)
    : { data: [] as { id: string; tmdb_id: number }[] };
  const foundByImdb = extImdb.length
    ? await supabase.from("movies").select("id, imdb_id").in("imdb_id", extImdb)
    : { data: [] as { id: string; imdb_id: string }[] };

  const tmdbMap = new Map<number, string>();
  foundByTmdb.data?.forEach(
    (row) => row.tmdb_id && tmdbMap.set(row.tmdb_id, row.id)
  );

  const imdbMap = new Map<string, string>();
  foundByImdb.data?.forEach(
    (row) => row.imdb_id && imdbMap.set(row.imdb_id, row.id)
  );

  // 3) Prepara inserciones faltantes
  type InsertMovie = {
    title: string;
    poster_url?: string | null;
    tags?: string[] | null;
    imdb_id?: string | null;
    tmdb_id?: number | null;
  };

  const toInsert: InsertMovie[] = [];
  const idxNeedingInsert: number[] = [];

  movies.forEach((m, i) => {
    if (internalIdx.includes(i)) return;

    if (externalIdx.includes(i)) {
      const has =
        (m.tmdb_id && tmdbMap.get(m.tmdb_id)) ||
        (m.imdb_id && imdbMap.get(m.imdb_id));
      if (has) return; // ya existe
      toInsert.push({
        title: m.title,
        poster_url: m.poster_url ?? null,
        tags: m.tags ?? null,
        imdb_id: m.imdb_id ?? null,
        tmdb_id: m.tmdb_id ?? null,
      });
      idxNeedingInsert.push(i);
      return;
    }

    // sueltos por título
    toInsert.push({
      title: m.title,
      poster_url: m.poster_url ?? null,
      tags: m.tags ?? null,
      imdb_id: null,
      tmdb_id: null,
    });
    idxNeedingInsert.push(i);
  });

  // 4) Inserta y recupera con title para poder casar
  let inserted: {
    id: string;
    imdb_id: string | null;
    tmdb_id: number | null;
    title: string;
  }[] = [];
  if (toInsert.length) {
    const { data, error } = await supabase
      .from("movies")
      .insert(toInsert)
      .select("id, imdb_id, tmdb_id, title"); // <- añadimos title para casarlo por nombre
    if (error) throw new Error(error.message);
    inserted = data ?? [];
  }

  // 5) Resolver UUID de cada movie en orden
  const movieIds: string[] = movies.map((m, i) => {
    // prioridad: interno → tmdb → imdb → recién insertado por tmdb/imdb → recién insertado por title
    if (m.id && isUuid(m.id)) return m.id;

    if (m.tmdb_id && tmdbMap.get(m.tmdb_id)) return tmdbMap.get(m.tmdb_id)!;
    if (m.imdb_id && imdbMap.get(m.imdb_id!)) return imdbMap.get(m.imdb_id!)!;

    if (m.tmdb_id) {
      const hit = inserted.find((x) => x.tmdb_id === m.tmdb_id);
      if (hit) return hit.id;
    }
    if (m.imdb_id) {
      const hit = inserted.find((x) => x.imdb_id === m.imdb_id);
      if (hit) return hit.id;
    }

    // custom puro (sin externos): casamos por título recién insertado
    const hitByTitle = inserted.find(
      (x) => !x.tmdb_id && !x.imdb_id && x.title === m.title
    );
    if (hitByTitle) return hitByTitle.id;

    throw new Error(`No se pudo resolver UUID para: ${m.title}`);
  });

  // 6) Crea plan (NO convertir fechas; usa strings)
  const start = days[0];
  const end = days[days.length - 1];
  const { data: plan, error: planErr } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      name,
      start_date: start,
      end_date: end,
      cadence: "custom",
    })
    .select()
    .single();
  if (planErr || !plan)
    throw new Error(planErr?.message ?? "Error creando plan");

  // 7) Interleave: sagas en orden interno, distribuidas entre el resto

  type Resolved = {
    resolvedId: string;
    title: string;
    isSaga?: boolean;
    sagaKey?: string;
    sagaOrder?: number;
  };

  // movies[] y movieIds[] están alineados por índice i
  const resolved: Resolved[] = movies.map((m, i) => ({
    resolvedId: movieIds[i],
    title: m.title,
    isSaga: !!m.isSaga,
    sagaKey: m.sagaKey?.trim() || undefined,
    sagaOrder:
      m.sagaOrder !== undefined && m.sagaOrder !== null
        ? Number(m.sagaOrder)
        : undefined,
  }));

  // 7.1) Agrupar por saga (isSaga + sagaKey) y sueltas
  const groupsMap = new Map<string, Resolved[]>();
  const singles: Resolved[] = [];

  for (const item of resolved) {
    if (item.isSaga && item.sagaKey) {
      const key = item.sagaKey;
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(item);
    } else {
      singles.push(item);
    }
  }

  // 7.2) Orden interno de cada saga por sagaOrder (fallback por título)
  const sagaBlocks: Resolved[][] = Array.from(groupsMap.values()).map((arr) =>
    arr.slice().sort((a, b) => {
      const ao = a.sagaOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.sagaOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    })
  );

  // 7.3) Cada suelta es un bloque de 1
  const blocks: Resolved[][] = [...sagaBlocks, ...singles.map((s) => [s])];

  // 7.4) Barajamos el orden de bloques (no su contenido)
  shuffleInPlace(blocks);

  /**
   * 7.5) Interleave (round-robin)
   * Recorre los bloques en ciclos; en cada ciclo toma 1 elemento de cada bloque (si queda),
   * así se reparten por el calendario manteniendo el orden interno.
   * Para darle un punto de aleatoriedad extra, empieza el ciclo en un offset aleatorio.
   */
  const interleaved = interleaveBlocks(blocks);

  // 7.6) Mapear al calendario
  const rows = days.map((d, i) => ({
    plan_id: plan.id,
    day_date: d,
    movie_id: interleaved[i].resolvedId,
    status: "locked" as const,
  }));

  const { error: pdErr } = await supabase.from("plan_days").insert(rows);
  if (pdErr) {
    await supabase.from("plans").delete().eq("id", plan.id);
    throw new Error(pdErr.message);
  }

  revalidatePath(`/plan/${plan.id}`);
  redirect(`/plan/${plan.id}`);
}
