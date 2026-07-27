import { buildPosterUrl } from "@/lib/tmdb";
import { Database } from "@/types/supabase";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export type MovieTMDB = Database["public"]["Tables"]["movies_cache"]["Row"];

export type Movie = {
  id?: string;
  imdb_id?: string | null;
  tmdb_id?: number | null;
  title: string;
  poster_url?: string | null;
  tags?: string[];
  isCustom?: boolean;
  year: string;
  sagaKey?: string;
  sagaOrder?: number;
  isSaga?: boolean;
  sagaInput?: boolean;
};

export function useMovieData(table: string): {
  movies: Movie[];
  loading: boolean;
  error: string | null;
} {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      setError(null);
      const { data, error } = (await supabase.from(table).select("*")) as {
        data: MovieTMDB[];
        error: any;
      };
      if (error) {
        setError(error.message);
        setMovies([]);
      } else {
        setMovies(
          data.map((m) => ({
            id: m.imdb_id,
            imdb_id: m.imdb_id,
            tmdb_id: m.tmdb_id,
            title: m.title_es,
            poster_url: buildPosterUrl(m.poster_path),
            tags: m.genres_es,
            isCustom: false,
            year: m.release_date?.split("-")[0] ?? "",
          }))
        );
      }
      setLoading(false);
    }
    fetchMovies();
  }, [table]);

  return { movies, loading, error };
}
