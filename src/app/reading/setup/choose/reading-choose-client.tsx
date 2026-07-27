"use client";

import { useI18n } from "@/i18n/provider";
import { useMemo, useState, useTransition } from "react";
import { createReadingPlanAction } from "./actions";
import OpenLibrarySearch, { OpenLibraryStory } from "./open-library-search";
import { Dices } from "lucide-react";

type Story = {
  id: string; title_es: string; title_en: string; author: string;
  genre_es: string; genre_en: string; reading_min: number;
};
type SelectedStory = { kind: "catalog"; story: Story } | { kind: "external"; story: OpenLibraryStory };

export default function ReadingChooseClient({ days, stories }: { days: string[]; stories: Story[] }) {
  const { locale, t } = useI18n();
  const [selected, setSelected] = useState<SelectedStory[]>([]);
  const [source, setSource] = useState<"catalog" | "open-library">("catalog");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => stories.filter((story) =>
    `${story.title_es} ${story.title_en} ${story.author}`.toLowerCase().includes(query.toLowerCase())
  ), [query, stories]);
  const selectedKeys = new Set(selected.map((item) =>
    item.kind === "catalog" ? item.story.id : item.story.open_library_id
  ));
  const toggleCatalog = (story: Story) => setSelected((current) =>
    selectedKeys.has(story.id)
      ? current.filter((item) => item.kind !== "catalog" || item.story.id !== story.id)
      : current.length < days.length ? [...current, { kind: "catalog", story }] : current
  );
  const toggleExternal = (story: OpenLibraryStory) => setSelected((current) =>
    selectedKeys.has(story.open_library_id)
      ? current.filter((item) => item.kind !== "external" || item.story.open_library_id !== story.open_library_id)
      : current.length < days.length ? [...current, { kind: "external", story }] : current
  );
  const chooseRandomly = () => {
    if (stories.length < days.length) {
      alert(t("notEnoughStories"));
      return;
    }
    const shuffled = [...stories];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);
      const target = random[0] % (index + 1);
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    setSelected(
      shuffled
        .slice(0, days.length)
        .map((story) => ({ kind: "catalog" as const, story }))
    );
  };

  return (
    <div className="mx-auto max-w-6xl py-10">
      <h1 className="text-3xl font-bold text-halloweenAccent">{t("readingChooseTitle", { count: days.length })}</h1>
      <p className="mt-2 text-white/70">{t("storySelectionHelp")}</p>

      <div className="mt-6 flex items-center justify-between rounded-t-2xl border border-b-0 border-white/10 bg-black/30 p-3">
        <div className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
          <button
            onClick={() => setSource("catalog")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              source === "catalog"
                ? "bg-white text-black"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            {t("recommendedStories")}
          </button>
          <button
            onClick={() => setSource("open-library")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              source === "open-library"
                ? "bg-violet-200 text-violet-950"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            {t("addYourOwnStories")}
          </button>
        </div>
        <strong className="rounded-full bg-halloweenAccent px-3 py-1 text-sm text-black">
          {selected.length}/{days.length}
        </strong>
      </div>

      {source === "catalog" ? (
        <section className="rounded-b-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("readingSearch")}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
            <button
              onClick={chooseRandomly}
              title={t("randomChoiceHelp")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-halloweenAccent px-4 py-2 font-semibold text-black transition hover:scale-[1.02]"
            >
              <Dices size={18} />
              {t("randomChoice")}
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((story) => {
              const active = selectedKeys.has(story.id);
              return (
                <button key={story.id} onClick={() => toggleCatalog(story)}
                  className={`rounded-xl border p-4 text-left ${active ? "border-halloweenAccent bg-halloweenAccent/15" : "border-white/10 bg-black/30"}`}>
                  <span className="text-xs uppercase tracking-wider text-halloweenUnlocked">{locale === "es" ? story.genre_es : story.genre_en}</span>
                  <h2 className="mt-1 text-lg font-semibold">{locale === "es" ? story.title_es : story.title_en}</h2>
                  <p className="text-sm text-white/60">{story.author} · {t("readingMinutes", { count: story.reading_min })}</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <OpenLibrarySearch
          selected={selectedKeys}
          disabled={selected.length >= days.length}
          onToggle={toggleExternal}
        />
      )}
      <div className="sticky bottom-4 mt-8 flex justify-end">
        <button disabled={selected.length !== days.length || pending}
          onClick={() => startTransition(() => createReadingPlanAction({
            days,
            stories: selected.map((item) =>
              item.kind === "catalog"
                ? { id: item.story.id }
                : {
                    open_library_id: item.story.open_library_id,
                    title: item.story.title,
                    author: item.story.author,
                    reading_min: item.story.reading_min,
                    source_url: item.story.source_url,
                    cover_url: item.story.cover_url,
                  }
            ),
          }))}
          className="rounded-full bg-halloweenAccent px-5 py-3 font-semibold text-black disabled:opacity-40">
          {pending ? t("creating") : t("readingCreate")}
        </button>
      </div>
    </div>
  );
}
