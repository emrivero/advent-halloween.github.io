"use client";

import MovieSearch from "@/components/MoviesSearch";
import { Movie, useMovieData } from "@/hooks/useMovieData";
import { useMemo, useState } from "react";
import { createPlanFromSelectionAction } from "./actions";

type PickMovie = Movie & {
  isSaga?: boolean;
  sagaKey?: string | null;
  sagaOrder?: number | null;
};

export default function ChooseMoviesClient({
  name,
  days,
}: {
  name: string;
  days: string[];
}) {
  const target = days.length;
  const [selected, setSelected] = useState<PickMovie[]>([]);
  const [tab, setTab] = useState<
    "Spooky" | "Sobrenatural" | "Slasher" | "Buscar"
  >("Spooky");
  const [confirmOpen, setConfirmOpen] = useState(false); // 👈 modal de confirmación

  const spooky = useMovieData("movies_spooky_cache");
  const slasher = useMovieData("movies_slasher_cache");
  const supernatural = useMovieData("movies_supernatural_cache");

  // --- Estado UI por tarjeta (sin sagaInput) ---
  const [draftSagaKeys, setDraftSagaKeys] = useState<Record<number, string>>(
    {}
  );
  const [sagaMode, setSagaMode] = useState<Record<number, "select" | "create">>(
    {}
  );

  // Sagas confirmadas (evita 1 sola letra)
  const sagaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          selected
            .filter(
              (s) =>
                s.isSaga &&
                typeof s.sagaKey === "string" &&
                s.sagaKey.trim().length >= 2
            )
            .map((s) => s.sagaKey!.trim())
        )
      ),
    [selected]
  );

  const pools: Record<string, Movie[]> = useMemo(
    () => ({
      Spooky: spooky.movies,
      Sobrenatural: supernatural.movies,
      Slasher: slasher.movies,
    }),
    [spooky.movies, slasher.movies, supernatural.movies]
  );

  const remaining = target - selected.length;

  const updateAt = (idx: number, patch: Partial<PickMovie>) =>
    setSelected((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m))
    );

  const togglePick = (m: Movie) => {
    setSelected((prev) => {
      const exists = prev.find((p) =>
        p.id ? p.id === m.id : p.title === m.title
      );
      if (exists)
        return prev.filter((p) => (p.id ? p.id !== m.id : p.title !== m.title));
      if (prev.length >= target) return prev; // no exceder
      // añadir con campos de saga por defecto
      return [
        ...prev,
        {
          ...m,
          isSaga: false,
          sagaKey: null,
          sagaOrder: null,
        },
      ];
    });
  };

  const removeAt = (idx: number) => {
    // limpia estados UI asociados
    setDraftSagaKeys((p) => {
      const { [idx]: _, ...rest } = p;
      return rest;
    });
    setSagaMode((p) => {
      const { [idx]: _, ...rest } = p;
      return rest;
    });
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  };

  // Helpers UI select/create
  const startCreateSaga = (i: number) => {
    setSagaMode((p) => ({ ...p, [i]: "create" }));
    setDraftSagaKeys((p) => ({ ...p, [i]: selected[i].sagaKey ?? "" }));
  };
  const cancelCreateSaga = (i: number) => {
    setSagaMode((p) => ({ ...p, [i]: "select" }));
    setDraftSagaKeys((p) => {
      const { [i]: _, ...rest } = p;
      return rest;
    });
  };
  const confirmCreateSagaLocal = (i: number) => {
    const name = (draftSagaKeys[i] ?? "").trim();
    if (!name) return;
    updateAt(i, { sagaKey: name, isSaga: true });
    cancelCreateSaga(i);
  };

  // Construye la carga FINAL que enviaremos (sin tocar todavía la BD)
  const buildPayload = () => {
    return selected.map((m, i) => {
      const effectiveSagaKey =
        (draftSagaKeys[i] ?? "").trim() ||
        (typeof m.sagaKey === "string" ? m.sagaKey?.trim() : "") ||
        null;

      return {
        // ids existentes
        id: (m as any).id,
        tmdb_id: (m as any).tmdb_id ?? null,
        imdb_id: (m as any).imdb_id ?? (m as any).imdb ?? null,
        // metadatos
        title: m.title,
        poster_url: m.poster_url ?? null,
        tags: m.tags ?? null,
        isCustom: (m as any).isCustom ?? false,
        // saga
        isSaga: !!m.isSaga,
        sagaKey: m.isSaga ? effectiveSagaKey : null,
        sagaOrder:
          m.isSaga &&
          m.sagaOrder !== undefined &&
          m.sagaOrder !== null &&
          !Number.isNaN(Number(m.sagaOrder))
            ? Number(m.sagaOrder)
            : null,
        // año para mostrar en resumen (no lo inserto si no tienes columna; se usa en UI)
        year: (m as any).year ?? null,
      };
    });
  };

  // Abre modal en vez de crear directamente
  const requestCreate = () => {
    if (selected.length !== target) {
      alert(
        `Debes elegir exactamente ${target} películas (te faltan ${remaining}).`
      );
      return;
    }
    setConfirmOpen(true);
  };

  // Confirmar en modal => llama a la action
  const [creating, setCreate] = useState(false);
  const confirmCreate = async () => {
    const payload = buildPayload();
    setCreate(true);
    await createPlanFromSelectionAction({
      name,
      days,
      movies: payload as any, // tu action ya acepta las props extendidas
    });
    // la action redirige al plan
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-halloweenAccent">
        Elige {target} película{target === 1 ? "" : "s"}
      </h1>
      <p className="text-white/70">
        Puedes mezclar categorías o añadir películas personalizadas.
      </p>

      {/* Tabs */}
      <div className="mt-4 inline-flex rounded-md border border-white/15 p-1">
        {(["Spooky", "Sobrenatural", "Slasher", "Buscar"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-3 py-1.5 text-sm rounded-md",
              tab === t ? "bg-white text-gray-900" : "hover:bg-white/5",
              t === "Buscar" && "border border-[#f0a500]",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Seleccionadas (orden final) */}
      <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm text-white/80">
            Seleccionadas:{" "}
            <strong>
              {selected.length}/{target}
            </strong>{" "}
            · <span className="text-white/60">Faltan {remaining}</span>
          </div>
        </div>

        {selected.length ? (
          <>
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selected.map((m, i) => (
                <li
                  key={`${m.id ?? "custom"}-${i}`}
                  className="flex items-center gap-2 rounded-md border border-white/10 bg-black/40 p-2"
                >
                  <img
                    src={m.poster_url ?? "/img/pumpkin.png"}
                    alt={m.title}
                    className="h-12 w-8 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium leading-tight">
                      {i + 1}. {m.title}
                    </div>
                    {!!m.tags?.length && (
                      <div className="text-xs text-white/60">
                        {m.tags.join(" · ")}
                      </div>
                    )}
                    {(m as any).year && (
                      <div className="text-xs text-white/60">
                        {(m as any).year}
                      </div>
                    )}

                    {/* ¿Es saga? */}
                    <div className="mt-2 text-xs text-left">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!m.isSaga}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            updateAt(i, {
                              isSaga: checked,
                              ...(checked
                                ? {}
                                : { sagaKey: null, sagaOrder: null }),
                            });
                            if (!checked) {
                              // limpiar modos/borradores si se desactiva
                              setDraftSagaKeys((p) => {
                                const { [i]: _, ...rest } = p;
                                return rest;
                              });
                              setSagaMode((p) => {
                                const { [i]: _, ...rest } = p;
                                return rest;
                              });
                            } else {
                              // por defecto, modo select si ya hay sagas, sino modo create
                              setSagaMode((p) => ({
                                ...p,
                                [i]:
                                  sagaOptions.length > 0 ? "select" : "create",
                              }));
                            }
                          }}
                          className="rounded border-white/15 bg-black/30"
                        />
                        <span className="text-white/80">¿Es saga?</span>
                      </label>
                    </div>

                    {/* Controles de saga (simple: input de clave y orden) */}
                    {m.isSaga && (
                      <div className="mt-2 grid grid-cols-6 gap-2 text-xs">
                        <label className="col-span-4 text-left">
                          <span className="block text-white/70 mb-1">
                            Saga (clave)
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              value={draftSagaKeys[i] ?? m.sagaKey ?? ""}
                              onChange={(e) =>
                                setDraftSagaKeys((p) => ({
                                  ...p,
                                  [i]: e.target.value,
                                }))
                              }
                              placeholder="conjuring, scream, alien…"
                              className="w-full rounded-md border border-white/15 bg-black/30 px-2 py-1 text-white"
                            />
                          </div>
                        </label>

                        <label className="col-span-2 text-left">
                          <span className="block text-white/70 mb-1">
                            Orden
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={m.sagaOrder ?? ""}
                            onChange={(e) =>
                              updateAt(i, {
                                sagaOrder: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              })
                            }
                            placeholder="1, 2, 3…"
                            className="w-full rounded-md border border-white/15 bg-black/30 px-2 py-1 text-white"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeAt(i)}
                    className="rounded-md border border-white/15 px-2 py-1 text-xs hover:bg-white/5"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ol>

            <div className="text-sm text-white/80 mt-4">
              <span className="text-white/60">
                <p className="bold">
                  · Usa la funcionalidad de saga para mantener el orden en las
                  películas de una misma serie ·
                </p>
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-white/60">Aún no has añadido películas.</p>
        )}
      </div>

      {/* CTA final */}
      <div className="mt-4 flex items-center justify-end gap-3">
        <div className="text-sm text-white/70">
          Restantes: <strong>{remaining}</strong>
        </div>
        <button
          onClick={requestCreate} // 👈 abre modal
          disabled={selected.length !== target}
          className={
            selected.length === target
              ? "rounded-full px-4 py-2 font-werebeast text-sm bg-halloweenAccent text-black hover:scale-105 transition-transform shadow-lg"
              : "rounded-full px-4 py-2 text-sm border border-white/15 text-white/60 cursor-not-allowed"
          }
        >
          Crear plan
        </button>
      </div>

      {/* Grid de la pestaña */}
      {tab !== "Buscar" ? (
        <div
          className="
          mt-4 grid gap-4
          [grid-template-columns:repeat(6,minmax(0,1fr))]
          max-[1280px]:[grid-template-columns:repeat(5,minmax(0,1fr))]
          max-[1024px]:[grid-template-columns:repeat(4,minmax(0,1fr))]
          max-[768px]:[grid-template-columns:repeat(3,minmax(0,1fr))]
          max-[560px]:[grid-template-columns:repeat(2,minmax(0,1fr))]
        "
        >
          {pools[tab].map((m) => {
            const picked = !!selected.find((p) =>
              p.id ? p.id === m.id : p.title === m.title
            );
            return (
              <button
                key={m.id ?? m.title}
                onClick={() => togglePick(m)}
                className={[
                  "relative overflow-hidden rounded-xl border p-2 text-left",
                  picked
                    ? "bg-white text-gray-900"
                    : "border-white/15 hover:bg-white/5",
                ].join(" ")}
                title={m.title}
              >
                <img
                  src={m.poster_url ?? "/img/pumpkin.png"}
                  alt={m.title}
                  className="aspect-[2/3] w-full rounded-md object-cover opacity-60"
                />
                <div className="mt-2 text-sm font-medium">{m.title}</div>
                <div className="text-xs text-white/60">
                  {m.tags?.join(" · ")}
                </div>
                <div className="text-xs text-white/60">{(m as any).year}</div>
                {picked && (
                  <span className="absolute right-2 top-2 rounded-full bg-[#22c55e] px-2 py-0.5 text-xs">
                    Añadida
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 relative z-40">
          <MovieSearch
            maxRemaining={target - selected.length}
            onAdd={(movie) => {
              if (selected.length >= target) return;
              setSelected((prev) => [
                ...prev,
                {
                  tmdb_id: movie.tmdb_id,
                  imdb_id: movie.imdb ?? null,
                  title: movie.title,
                  poster_url: movie.poster_url ?? null,
                  tags: movie.genres ?? [],
                  isCustom: true,
                } as any,
              ]);
            }}
          />
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div
            className="modal-panel max-h-[85vh] w-[min(900px,95vw)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (fijo) */}
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold text-halloweenAccent">
                Confirma tu calendario sorpresa
              </h2>
              <button
                onClick={() => setConfirmOpen(false)}
                className="text-[#f0a500] text-2xl leading-none"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>

            {/* Subtítulo (fijo) */}
            <p className="mt-1 text-sm text-white/70">
              Revisa los datos de cada película antes de crear el plan.
            </p>

            {/* Body (SCROLL) */}
            <div className="mt-4 overflow-y-auto overscroll-contain pr-1">
              <ul
                className="
            grid gap-3
            [grid-template-columns:repeat(2,minmax(0,1fr))]
            max-[768px]:[grid-template-columns:repeat(1,minmax(0,1fr))]
          "
              >
                {buildPayload().map((m, i) => (
                  <li
                    key={`${m.title}-${i}`}
                    className="flex gap-3 rounded-md border border-white/10 bg-black/40 p-2"
                  >
                    <img
                      src={m.poster_url ?? "/img/pumpkin.png"}
                      alt={m.title}
                      className="h-16 w-11 rounded object-cover"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">
                        {i + 1}. {m.title}{" "}
                        <span className="text-white/60">
                          {m.year ? `(${m.year})` : ""}
                        </span>
                      </div>
                      <div className="text-white/70">
                        <span className="opacity-70">Saga:</span>{" "}
                        {m.isSaga && m.sagaKey ? (
                          m.sagaKey
                        ) : (
                          <em className="text-white/50">—</em>
                        )}
                        {" · "}
                        <span className="opacity-70">Orden:</span>{" "}
                        {m.isSaga && m.sagaOrder ? (
                          m.sagaOrder
                        ) : (
                          <em className="text-white/50">—</em>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer (fijo) */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                disabled={creating}
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-white/15 px-4 py-2 hover:bg-white/5"
              >
                Seguir editando
              </button>
              <button
                onClick={confirmCreate}
                disabled={creating}
                className="disabled:opacity-60 rounded-full px-4 py-2 font-werebeast text-sm bg-halloweenAccent text-black hover:scale-105 transition-transform shadow-lg"
              >
                {creating ? "Creando..." : "Confirmar y crear plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
