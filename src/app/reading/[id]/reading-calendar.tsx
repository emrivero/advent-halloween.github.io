"use client";

import { useI18n } from "@/i18n/provider";
import { BookOpen, Check, Lock, SkipForward } from "lucide-react";
import { useState, useTransition } from "react";
import { setReadingStatusAction } from "./actions";

type Day = {
  id: string; day_date: string; status: "locked" | "unlocked" | "read" | "skipped";
  story: { title_es: string; title_en: string; author: string; genre_es: string; genre_en: string; reading_min: number; source_url: string };
};

export default function ReadingCalendar({ plan, days, today }: { plan: { name: string; start_date: string; end_date: string }; days: Day[]; today: string }) {
  const { locale, t } = useI18n();
  const [list, setList] = useState(days);
  const [open, setOpen] = useState<Day | null>(null);
  const [pending, startTransition] = useTransition();
  const update = (day: Day, status: "read" | "skipped") => {
    const previous = list;
    setList((items) => items.map((item) => item.id === day.id ? { ...item, status } : item));
    setOpen(null);
    startTransition(async () => {
      try { await setReadingStatusAction(day.id, status); }
      catch { setList(previous); alert(t("updateDayError")); }
    });
  };

  return (
    <div className="mx-auto max-w-6xl py-10">
      <p className="text-xs uppercase tracking-[0.3em] text-halloweenUnlocked">{t("readingEyebrow")}</p>
      <h1 className="mt-2 text-4xl font-bold text-halloweenAccent">{plan.name}</h1>
      <p className="mt-1 text-white/60">{plan.start_date} → {plan.end_date} · {t("readingCount", { count: days.length })}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((day) => {
          const locked = day.status === "locked" && day.day_date > today;
          const title = locale === "es" ? day.story.title_es : day.story.title_en;
          return (
            <button key={day.id} disabled={locked} onClick={() => setOpen(day)}
              className={`min-h-48 rounded-2xl border p-5 text-left transition ${locked ? "border-white/10 bg-black/20 opacity-60" : "border-halloweenAccent/40 bg-black/40 hover:border-halloweenAccent"}`}>
              <div className="flex justify-between">
                <span className="text-sm text-white/60">{day.day_date}</span>
                {locked ? <Lock size={18} /> : day.status === "read" ? <Check className="text-green-400" size={18} /> : day.status === "skipped" ? <SkipForward size={18} /> : <BookOpen size={18} />}
              </div>
              <h2 className={`mt-8 text-xl font-semibold ${locked ? "blur-sm select-none" : ""}`}>{locked ? "████████" : title}</h2>
              {!locked && <p className="mt-2 text-sm text-white/60">{day.story.author} · {t("readingMinutes", { count: day.story.reading_min })}</p>}
            </button>
          );
        })}
      </div>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className="modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
            <p className="text-xs uppercase tracking-wider text-halloweenUnlocked">{locale === "es" ? open.story.genre_es : open.story.genre_en}</p>
            <h2 className="mt-2 text-2xl font-bold">{locale === "es" ? open.story.title_es : open.story.title_en}</h2>
            <p className="mt-1 text-white/60">{open.story.author} · {t("readingMinutes", { count: open.story.reading_min })}</p>
            <a href={open.story.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-md bg-white px-4 py-2 text-black">{t("readingOpen")}</a>
            <div className="mt-6 flex gap-3">
              <button disabled={pending} onClick={() => update(open, "read")} className="rounded-md bg-halloweenAccent px-4 py-2 text-black">{t("readingMarkRead")}</button>
              <button disabled={pending} onClick={() => update(open, "skipped")} className="rounded-md border border-white/15 px-4 py-2">{t("skip")}</button>
              <button onClick={() => setOpen(null)} className="ml-auto px-3 py-2">{t("close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
