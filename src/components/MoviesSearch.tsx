"use client";

import { MovieDetail, useMovieSearch } from "@/hooks/useMovieSearch";
import { useEffect } from "react";

export default function MovieSearch({
  onAdd,
  maxRemaining,
}: {
  onAdd: (movie: MovieDetail) => void;
  maxRemaining: number;
}) {
  const {
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
  } = useMovieSearch(300);

  const canAdd = !!detail && maxRemaining > 0;

  useEffect(() => {
    if (!detail) return;
    document.documentElement.classList.add("overflow-hidden");
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [detail]);

  return (
    <div ref={containerRef} className="relative z-index-[100]">
      {/* Input */}
      {loading && q && (
        <div
          className="pointer-events-none absolute right-[90px] top-1/2 -translate-y-[12px] flex items-center"
          aria-label="Cargando"
          role="status"
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca una película…"
          className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white"
          onFocus={() => q.trim() && setOpen(true)}
        />
        <button
          onClick={() => inputRef.current?.focus()}
          disabled={loading}
          className="rounded-md border border-white/15 px-3 py-2 hover:bg-white/5"
        >
          {loading ? "…" : "Buscar"}
        </button>
      </div>

      {/* Dropdown */}
      {open && items.length > 0 && (
        <ul className="absolute z-80 mt-1 max-h-80 w-full overflow-auto rounded-md border border-white/15 bg-black/90 backdrop-blur">
          {items.map((it) => (
            <li
              key={`${it.tmdb_id}-${it.title}`}
              className="cursor-pointer px-3 py-2 hover:bg-white/5"
              onClick={() => onPick(it)}
              title={it.title}
            >
              <div className="flex items-center gap-2">
                <img
                  src={it.poster_url ?? "/img/pumpkin.png"}
                  alt={it.title}
                  className="h-9 w-6 rounded object-cover opacity-80"
                />
                <span className="text-sm">{it.title}</span>
                <span className="ml-auto text-xs text-white/50">
                  {it.year ?? "—"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {err && <div className="mt-1 text-xs text-red-400">{err}</div>}

      {/* Modal */}
      {detail && (
        <div
          className="modal-backdrop overflow-y-auto overscroll-contain"
          onClick={closeDetail}
        >
          <div
            className="
        modal-panel
        w-[min(900px,95vw)]
        max-h-[90svh] md:max-h-[85svh]
        overflow-y-auto
      "
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de ${detail.title}`}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold">
                {detail.title} {detail.year ? `(${detail.year})` : ""}
              </h2>
              <button
                onClick={() => {
                  // al cerrar, restauramos el scroll del body
                  if (typeof document !== "undefined") {
                    document.documentElement.classList.remove(
                      "overflow-hidden"
                    );
                  }
                  closeDetail();
                }}
                className="text-[#f0a500] text-2xl leading-none"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[200px_1fr]">
              <img
                src={detail.poster_url ?? "/img/pumpkin.png"}
                alt={detail.title}
                className="h-[300px] w-auto rounded-md object-cover justify-self-center"
              />
              <div>
                {detailLoading ? (
                  <p className="text-white/70">Cargando…</p>
                ) : detailErr ? (
                  <p className="text-red-400">{detailErr}</p>
                ) : (
                  <>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">
                      {detail.overview || "Sinopsis no disponible."}
                    </p>
                    <div className="mt-3 text-sm text-white/70">
                      {detail.runtime_min ? (
                        <span>Duración: {detail.runtime_min} min</span>
                      ) : null}
                      {!!detail.genres?.length && (
                        <span className="ml-4">
                          Géneros: {detail.genres.join(", ")}
                        </span>
                      )}
                      {detail.released ? (
                        <span className="ml-4">Estreno: {detail.released}</span>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (typeof document !== "undefined") {
                    document.documentElement.classList.remove(
                      "overflow-hidden"
                    );
                  }
                  closeDetail();
                }}
                className="rounded-md border border-white/15 px-4 py-2 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                disabled={!canAdd}
                onClick={() => {
                  if (!detail) return;
                  onAdd(detail);
                  if (typeof document !== "undefined") {
                    document.documentElement.classList.remove(
                      "overflow-hidden"
                    );
                  }
                  closeDetail();
                }}
                className={
                  canAdd
                    ? "rounded-md bg-white px-4 py-2 text-gray-900"
                    : "rounded-md border border-white/15 px-4 py-2 text-white/60 cursor-not-allowed"
                }
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
