"use client";

import {
  eachDayOfInterval,
  format,
  getDay,
  isSameDay,
  isWeekend,
} from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/provider";

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // YYYY-MM-DD en hora local
};
const mondayIndex = (d: Date) => (getDay(d) + 6) % 7;

export default function PlanSetupClient() {
  const { t } = useI18n();
  const router = useRouter();
  const year = new Date().getFullYear();
  const start = new Date(year, 9, 1);
  const end = new Date(year, 9, 31);
  const today = new Date();

  const [name, setName] = useState(`Halloween ${year}`);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const daysArr = eachDayOfInterval({ start, end });
  const leading = mondayIndex(start);
  const grid: (Date | null)[] = Array.from(
    { length: leading },
    () => null
  ).concat(daysArr);

  const toggle = (d: Date) => {
    const key = iso(d);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectWeekends = () =>
    setSelected(new Set(daysArr.filter((d) => isWeekend(d)).map(iso)));
  const selectWeekdays = () =>
    setSelected(new Set(daysArr.filter((d) => !isWeekend(d)).map(iso)));
  const allDays = () => setSelected(new Set(daysArr.map(iso)));
  const clearAll = () => setSelected(new Set());

  const selectedSorted = Array.from(selected).sort();
  const count = selectedSorted.length;
  const startDate = count ? selectedSorted[0] : null;
  const endDate = count ? selectedSorted[count - 1] : null;

  const goChoose = () => {
    if (!count) return alert(t("selectOneDay"));
    const params = new URLSearchParams({
      name,
      days: selectedSorted.join(","),
    });
    router.push(`/plan/setup/choose?${params.toString()}`);
  };

  return (
    <div className="mt-6 space-y-5">
      <p className="text-xl font-semibold">{t("chooseOctoberDays")}</p>

      {/* <label className="block text-left">
        <span className="text-sm text-white/80">Nombre del plan</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white"
        />
      </label> */}

      <div className="flex flex-wrap gap-2 sm:justify-center">
        <button
          onClick={selectWeekends}
          className="rounded-md border border-white/15 px-2 py-1.5 text-sm hover:bg-white/5"
        >
          {t("weekends")}
        </button>
        <button
          onClick={selectWeekdays}
          className="rounded-md border border-white/15 px-2 py-1.5 text-sm hover:bg-white/5"
        >
          {t("weekdays")}
        </button>
        <button
          onClick={allDays}
          className="rounded-md border border-white/15 px-2 py-1.5 text-sm hover:bg-white/5"
        >
          {t("monsterMode")}
        </button>
        <button
          onClick={clearAll}
          className="rounded-md border border-white/15 px-2 py-1.5 text-sm hover:bg-white/5"
        >
          {t("clear")}
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-white/60 text-xs">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {grid.map((d, i) => {
          if (!d)
            return (
              <div
                key={`pad-${i}`}
                className="h-[70px] rounded-[16px] border border-transparent"
              />
            );
          const key = iso(d);
          const isSel = selected.has(key);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={key}
              onClick={() => toggle(d)}
              className={[
                "relative h-[70px] rounded-[16px] border text-sm transition",
                isSel
                  ? "bg-white text-gray-900"
                  : "border-white/15 hover:bg-white/5 text-white/80",
                isToday && !isSel ? "ring-1 ring-[#f0a500]/70" : "",
              ].join(" ")}
              title={format(d, "PPPP", { locale: es })}
            >
              <div className="absolute left-2 top-2 text-xs opacity-70">
                {format(d, "d", { locale: es })}
              </div>
              {isSel && (
                <span className="absolute right-2 top-2 inline-block h-2.5 w-2.5 rounded-full bg-[#10b981]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="text-sm text-white/80">
          {t("selected", { count })}
          {startDate && endDate && (
            <>
              {" "}
              · {t("range")}: <span className="opacity-90">{startDate}</span> →{" "}
              <span className="opacity-90">{endDate}</span>
            </>
          )}
        </div>
        <button
          onClick={goChoose}
          disabled={!count}
          className={
            count
              ? "rounded-md bg-white px-4 py-2 text-gray-900"
              : "rounded-md border border-white/15 px-4 py-2 text-white/60 cursor-not-allowed"
          }
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
