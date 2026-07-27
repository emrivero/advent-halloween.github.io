"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SearchItem = {
  tmdb_id: number | null;
  title: string;
  year: string | number | null;
  release_date: string | null;
  poster_url: string | null;
  overview?: string;
  vote_average?: number | null;
};

export type MovieDetail = {
  tmdb_id: number;
  imdb: string | null;
  title: string;
  year: string | null;
  overview: string;
  runtime_min: number | null;
  genres: string[];
  released: string | null;
  poster_url: string | null;
};

export function useMovieSearch(debounceMs = 300) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const detailAbortRef = useRef<AbortController | null>(null);

  // Debounced search
  useEffect(() => {
    const controller = new AbortController();
    if (!q.trim()) {
      setItems([]);
      setOpen(false);
      setErr(null);
      return;
    }
    setLoading(true);
    setErr(null);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
          signal: controller.signal,
        });
        const j = await r.json();
        if (r.ok) {
          setItems(j.results ?? []);
          setOpen(true);
        } else {
          setErr(j?.error ?? "Error al buscar");
          setItems([]);
          setOpen(false);
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message ?? "Error al buscar");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, debounceMs);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, debounceMs]);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!(ev.target instanceof Node)) return;
      if (!containerRef.current) return;
      if (!containerRef.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const onPick = useCallback(async (it: SearchItem) => {
    if (!it.tmdb_id) return;
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    setOpen(false);
    setDetailErr(null);
    setDetailLoading(true);
    try {
      const r = await fetch(`/api/movie?tmdb=${it.tmdb_id}`, {
        signal: controller.signal,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Error cargando detalle");
      setDetail(j as MovieDetail);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setDetailErr(e?.message ?? "Error cargando detalle");
      setDetail(null);
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    detailAbortRef.current?.abort();
    setDetailLoading(false);
    setDetail(null);
  }, []);

  const bindings = useMemo(
    () => ({
      containerRef,
      inputRef,
      q,
      setQ,
      items,
      open,
      setOpen,
      loading,
      err,
      onPick,
      detail,
      detailLoading,
      detailErr,
      closeDetail,
    }),
    [
      q,
      items,
      open,
      loading,
      err,
      onPick,
      detail,
      detailLoading,
      detailErr,
      closeDetail,
    ]
  );

  return bindings;
}
