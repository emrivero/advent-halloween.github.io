"use client";

import { useI18n } from "@/i18n/provider";
import { BookPlus, Search } from "lucide-react";
import { useEffect, useState } from "react";

export type OpenLibraryStory = {
  open_library_id: string;
  title: string;
  author: string;
  year: number | null;
  reading_min: number;
  cover_url: string | null;
  source_url: string;
};

export default function OpenLibrarySearch({
  selected,
  disabled,
  onToggle,
}: {
  selected: Set<string>;
  disabled: boolean;
  onToggle: (story: OpenLibraryStory) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenLibraryStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return () => controller.abort();
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/stories/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setResults(body.results ?? []);
      } catch (caught: any) {
        if (caught?.name !== "AbortError")
          setError(caught?.message ?? t("storySearchError"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, t]);

  return (
    <section className="rounded-b-2xl border border-violet-400/20 bg-violet-950/20 p-5">
      <div className="flex items-center gap-2">
        <BookPlus className="text-violet-300" />
        <div>
          <h2 className="text-xl font-semibold">{t("openLibraryTitle")}</h2>
          <p className="text-sm text-white/60">{t("openLibraryIntro")}</p>
        </div>
      </div>
      <div className="relative mt-4">
        <Search className="absolute left-3 top-2.5 text-white/40" size={19} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("openLibraryPlaceholder")}
          className="w-full rounded-md border border-white/15 bg-black/40 py-2 pl-10 pr-3"
        />
      </div>
      {loading && <p className="mt-3 text-sm text-white/60">{t("loading")}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {!loading && query.length >= 2 && !error && results.length === 0 && (
        <p className="mt-3 text-sm text-white/60">{t("noStoryResults")}</p>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {results.map((story) => {
          const active = selected.has(story.open_library_id);
          return (
            <button
              key={story.open_library_id}
              disabled={disabled && !active}
              onClick={() => onToggle(story)}
              className={`flex gap-3 rounded-xl border p-3 text-left disabled:opacity-40 ${
                active
                  ? "border-violet-300 bg-violet-300/15"
                  : "border-white/10 bg-black/30"
              }`}
            >
              {story.cover_url ? (
                <img
                  src={story.cover_url}
                  alt=""
                  className="h-20 w-14 rounded object-cover"
                />
              ) : (
                <div className="flex h-20 w-14 items-center justify-center rounded bg-white/5">
                  <BookPlus size={20} />
                </div>
              )}
              <span>
                <strong className="block">{story.title}</strong>
                <span className="text-sm text-white/60">
                  {story.author}
                  {story.year ? ` · ${story.year}` : ""}
                </span>
                <span className="mt-1 block text-xs text-white/50">
                  {t("readingMinutes", { count: story.reading_min })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-white/40">{t("openLibraryCredit")}</p>
    </section>
  );
}
