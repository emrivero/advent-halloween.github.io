// src/components/TimeDebugBar.tsx
"use client";
import { addDays, formatISO, parseISO } from "date-fns";
import { useI18n } from "@/i18n/provider";

export default function TimeDebugBar({ initial }: { initial: string }) {
  const { t } = useI18n();
  if (process.env.NODE_ENV === "production") return null;

  const setCookie = (value: string | null) => {
    if (value) document.cookie = `x-debug-today=${value}; path=/`;
    else document.cookie = `x-debug-today=; Max-Age=0; path=/`;
    location.reload();
  };

  const shift = (delta: number) => {
    const base = initial ? parseISO(initial) : new Date();
    const next = addDays(base, delta);
    setCookie(formatISO(next, { representation: "date" })); // YYYY-MM-DD
  };

  return (
    <div className="z-50 rounded-md border border-white/15 bg-black/70 px-3 py-2 text-sm backdrop-blur">
      <span className="mr-3">
        🕒 debugDate: <b>{initial}</b>
      </span>
      <button
        onClick={() => shift(-1)}
        className="mr-2 rounded border border-white/15 px-2 py-1 hover:bg-white/5"
      >
        {t("previousDay")}
      </button>
      <button
        onClick={() => shift(+1)}
        className="mr-2 rounded border border-white/15 px-2 py-1 hover:bg-white/5"
      >
        {t("nextDay")}
      </button>
      <button
        onClick={() => shift(-5)}
        className="mr-2 rounded border border-white/15 px-2 py-1 hover:bg-white/5"
      >
        –5 día
      </button>
      <button
        onClick={() => shift(+5)}
        className="mr-2 rounded border border-white/15 px-2 py-1 hover:bg-white/5"
      >
        +5 día
      </button>
      <button
        onClick={() => setCookie(null)}
        className="rounded border border-white/15 px-2 py-1 hover:bg-white/5"
      >
        {t("reset")}
      </button>
    </div>
  );
}
