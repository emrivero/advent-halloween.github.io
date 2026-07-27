"use client";

import { eachDayOfInterval, format, getDay, isWeekend } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { useI18n } from "@/i18n/provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ymd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function ReadingSetupClient() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const year = new Date().getFullYear();
  const days = eachDayOfInterval({
    start: new Date(year, 9, 1),
    end: new Date(year, 9, 31),
  });
  const padding = (getDay(days[0]) + 6) % 7;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (date: Date) =>
    setSelected((previous) => {
      const next = new Set(previous);
      const key = ymd(date);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const sorted = [...selected].sort();
  const goNext = () => {
    if (!sorted.length) return alert(t("selectOneDay"));
    router.push(`/reading/setup/choose?days=${encodeURIComponent(sorted.join(","))}`);
  };

  return (
    <div className="mx-auto max-w-3xl py-10">
      <p className="text-xs uppercase tracking-[0.3em] text-halloweenUnlocked">{t("readingEyebrow")}</p>
      <h1 className="mt-2 text-4xl font-bold text-halloweenAccent">{t("readingSetupTitle")}</h1>
      <p className="mt-2 text-white/70">{t("readingSetupIntro")}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button className="rounded-md border border-white/15 px-3 py-2" onClick={() => setSelected(new Set(days.filter((day) => isWeekend(day)).map(ymd)))}>{t("weekends")}</button>
        <button className="rounded-md border border-white/15 px-3 py-2" onClick={() => setSelected(new Set(days.map(ymd)))}>{t("monsterMode")}</button>
        <button className="rounded-md border border-white/15 px-3 py-2" onClick={() => setSelected(new Set())}>{t("clear")}</button>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2">
        {Array.from({ length: padding }, (_, index) => <div key={`pad-${index}`} />)}
        {days.map((date) => {
          const key = ymd(date);
          const active = selected.has(key);
          return (
            <button key={key} onClick={() => toggle(date)} title={format(date, "PPPP", { locale: locale === "es" ? es : enUS })}
              className={`h-16 rounded-xl border ${active ? "bg-halloweenAccent text-black" : "border-white/15 hover:bg-white/5"}`}>
              <span className="text-lg font-semibold">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4">
        <span>{t("selected", { count: sorted.length })}</span>
        <button onClick={goNext} disabled={!sorted.length} className="rounded-md bg-white px-4 py-2 text-black disabled:opacity-40">{t("continue")}</button>
      </div>
    </div>
  );
}
