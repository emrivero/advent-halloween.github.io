"use client";

import { useMemo, useState, useTransition } from "react";
import { setAllowedAction } from "./actions";

type MovieCard = {
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
  runtime_min: number | null;
  tags: string[];
  allowed: boolean;
};

export default function CatalogClient({
  initialMovies,
}: {
  initialMovies: MovieCard[];
}) {
  const [movies, setMovies] = useState<MovieCard[]>(initialMovies);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string>("__any");
  const [pending, startTransition] = useTransition();

  const tags = useMemo(() => {
    const all = new Set<string>();
    movies.forEach((m) => m.tags?.forEach((t) => all.add(t)));
    return ["__any", ...Array.from(all).sort()];
  }, [movies]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return movies.filter((m) => {
      const matchText =
        !text ||
        m.title.toLowerCase().includes(text) ||
        (m.year ? String(m.year).includes(text) : false);
      const matchTag = tag === "__any" || m.tags.includes(tag);
      return matchText && matchTag;
    });
  }, [movies, q, tag]);

  const toggleAllowed = (id: string, next: boolean) => {
    // optimista
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, allowed: next } : m))
    );
    startTransition(async () => {
      try {
        await setAllowedAction(id, next);
      } catch (e) {
        // rollback en caso de error
        setMovies((prev) =>
          prev.map((m) => (m.id === id ? { ...m, allowed: !next } : m))
        );
        alert("No se pudo guardar la preferencia. Reintenta.");
      }
    });
  };

  return (
    <div className="mt-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar título o año…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-white/50 min-w-[260px]"
          />
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white"
          >
            {tags.map((t) => (
              <option key={t} value={t}>
                {t === "__any" ? "Cualquier tag" : t}
              </option>
            ))}
          </select>
        </div>
        <div className="text-white/70 text-sm">
          {pending ? "Guardando cambios…" : null} Total: {filtered.length}
        </div>
      </div>

      {/* Grid */}
      <div
        className="
          mt-6 grid gap-4
          [grid-template-columns:repeat(6,minmax(0,1fr))]
          max-[1280px]:[grid-template-columns:repeat(5,minmax(0,1fr))]
          max-[1024px]:[grid-template-columns:repeat(4,minmax(0,1fr))]
          max-[768px]:[grid-template-columns:repeat(3,minmax(0,1fr))]
          max-[560px]:[grid-template-columns:repeat(2,minmax(0,1fr))]
        "
      >
        {filtered.map((m) => (
          <article
            key={m.id}
            className={[
              "relative rounded-xl border p-2",
              m.allowed ? "border-[#f0a500]/60" : "border-white/10 opacity-60",
              "bg-black/30",
            ].join(" ")}
          >
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-black/30 flex items-center justify-center">
              {m.poster_url ? (
                <img
                  src={m.poster_url}
                  alt={m.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-white/40 text-sm px-2">Sin poster</span>
              )}
            </div>

            <div className="mt-2 px-1">
              <h3 className="text-sm font-semibold leading-tight">{m.title}</h3>
              <p className="text-xs text-white/60">
                {m.year ?? "—"} · {m.runtime_min ? `${m.runtime_min} min` : "—"}
              </p>
              {!!m.tags?.length && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] rounded bg-white/10 px-2 py-0.5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              <button
                onClick={() => toggleAllowed(m.id, !m.allowed)}
                className={[
                  "rounded-md px-2 py-1 text-xs font-medium",
                  m.allowed
                    ? "bg-white text-gray-900"
                    : "border border-white/15 hover:bg-white/5",
                ].join(" ")}
                title={m.allowed ? "Excluir del plan" : "Incluir en el plan"}
              >
                {m.allowed ? "Incluida ✓" : "Excluida"}
              </button>
              {/* sitio para ⭐ weight, futuro */}
            </div>

            {!m.allowed && (
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-white/10" />
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
