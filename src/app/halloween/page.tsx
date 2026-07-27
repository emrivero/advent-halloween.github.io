"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/provider";

type Movie = { title: string; img: string };
type MoviesFile = { date: string; movies: Movie[] };
const fallbackMovies: Movie[] = [
  "Psicosis", "Alien", "La cosa", "El resplandor", "Scream", "Halloween",
  "Déjame salir", "Hereditary", "The Witch", "It", "REC", "El exorcista",
  "Nosferatu", "Carrie", "Poltergeist", "Candyman", "The Ring", "Saw",
  "El proyecto de la bruja de Blair", "La noche de los muertos vivientes",
  "Suspiria", "The Babadook", "Un lugar tranquilo", "Midsommar",
  "La semilla del diablo", "Pesadilla en Elm Street", "Viernes 13",
  "La matanza de Texas", "Tiburón", "Coraline", "Truco o trato",
].map((title) => ({ title, img: "/img/pumpkin.png" }));

// util simple de shuffle in-place
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isUnlocked(day: number, monthIndex: number, now: Date) {
  return now >= new Date(now.getFullYear(), monthIndex, day);
}

export default function HalloweenCalendarPage() {
  const { t } = useI18n();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [dataDate, setDataDate] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    open: boolean;
    movie?: Movie;
    day?: number;
  }>({ open: false });

  // Carga movies.json desde /public (en Next se sirve estático)
  useEffect(() => {
    (async () => {
      let json: MoviesFile;
      try {
        const res = await fetch("/movies.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Catálogo no disponible");
        json = await res.json();
        if (!Array.isArray(json.movies) || json.movies.length < 31)
          throw new Error("Catálogo incompleto");
      } catch {
        json = { date: "fallback-1", movies: fallbackMovies };
      }
      setDataDate(json.date);

      const ls = localStorage.getItem("data");
      let selected: Movie[] = [];

      if (ls) {
        let prev: MoviesFile | null = null;
        try {
          prev = JSON.parse(ls) as MoviesFile;
        } catch {
          localStorage.removeItem("data");
          localStorage.removeItem("movies");
        }
        if (!prev || prev.date !== json.date) {
          // Nueva versión -> reshuffle
          selected = shuffle([...json.movies]);
          localStorage.setItem("movies", JSON.stringify(selected));
          localStorage.setItem("data", JSON.stringify(json));
        } else {
          // Misma versión -> reusar orden
          const cached = localStorage.getItem("movies");
          try {
            selected = cached ? JSON.parse(cached) : [];
          } catch {
            selected = [];
          }
          if (!Array.isArray(selected) || selected.length < 31) {
            selected = shuffle([...json.movies]);
            localStorage.setItem("movies", JSON.stringify(selected));
          }
        }
      } else {
        // Primera vez
        selected = shuffle([...json.movies]);
        localStorage.setItem("movies", JSON.stringify(selected));
        localStorage.setItem("data", JSON.stringify(json));
      }

      setMovies(selected);
    })();
  }, []);

  const now = useMemo(() => new Date(), []);
  const OCTOBER_INDEX = 9;

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen font-werebeast">
      <header className="py-6">
        <h1 className="relative mx-auto inline-block text-4xl md:text-5xl font-bold text-halloweenAccent">
          {t("halloweenCalendar")}
        </h1>
        {dataDate && (
          <p className="mt-2 text-white/70 text-sm">
            {t("catalogVersion", { version: dataDate })}
          </p>
        )}
      </header>

      <section
        className="
          grid justify-items-center gap-2 p-5
          [grid-template-columns:repeat(7,minmax(0,1fr))]
          max-[1200px]:[grid-template-columns:repeat(5,minmax(0,1fr))]
          max-[992px]:[grid-template-columns:repeat(4,minmax(0,1fr))]
          max-[768px]:[grid-template-columns:repeat(3,minmax(0,1fr))]
          max-[576px]:[grid-template-columns:repeat(2,minmax(0,1fr))]
          max-[400px]:[grid-template-columns:repeat(1,minmax(0,1fr))]
        "
      >
        {days.map((day) => {
          const unlocked = isUnlocked(day, OCTOBER_INDEX, now);
          const movie = movies[day - 1]; // 1-based -> 0-based
          return (
            <button
              key={day}
              className={[
                "relative m-8 flex h-[120px] w-[120px] items-center justify-center cursor-pointer rounded-pumpkin md:h-[140px] md:w-[140px] lg:h-[160px] lg:w-[160px]",
                unlocked
                  ? "bg-halloweenAccent/65 bg-pumpkin bg-cover bg-center hover:bg-halloweenAccent hover:mix-blend-multiply transition-colors"
                  : "bg-halloweenAccent/65",
              ].join(" ")}
              onClick={() => {
                if (!unlocked || !movie) return;
                setModal({ open: true, movie, day });
              }}
            >
              {!unlocked && <span className="lock" aria-hidden="true" />}
              <div
                className="
                absolute -bottom-14 flex h-[45px] w-[45px] items-center justify-center rounded-full border-2 border-halloweenAccent bg-black/70 text-white text-sm md:h-[50px] md:w-[50px] md:text-base lg:h-[54px] lg:w-[54px]
              "
              >
                {t("day", { day })}
              </div>
            </button>
          );
        })}
      </section>

      {/* Modal */}
      {modal.open && modal.movie && (
        <div
          className="modal-backdrop"
          onClick={() => setModal({ open: false })}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold">
                {t("recommendation", { day: modal.day ?? "", title: modal.movie.title })}
              </h2>
              <button
                onClick={() => setModal({ open: false })}
                className="text-halloweenAccent text-2xl leading-none"
                aria-label={t("close")}
              >
                &times;
              </button>
            </div>
            <div className="mt-4">
              <img
                src={modal.movie.img}
                alt={modal.movie.title}
                className="mx-auto max-h-[60vh] w-auto rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
