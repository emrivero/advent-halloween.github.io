"use server";

import { normalizePlanDays, isUuid, shuffleInPlace } from "@/lib/plan";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type SelectedStory =
  | { id: string }
  | {
      open_library_id: string;
      title: string;
      author: string;
      reading_min: number;
      source_url: string;
      cover_url: string | null;
    };

export async function createReadingPlanAction(input: { days: string[]; stories: SelectedStory[] }) {
  const days = normalizePlanDays(input.days);
  if (input.stories.length !== days.length)
    throw new Error("Invalid reading selection");
  const supabase = (await createSupabaseServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const internalIds = input.stories
    .filter((story): story is { id: string } => "id" in story)
    .map((story) => story.id);
  if (internalIds.some((id) => !isUuid(id))) throw new Error("Unknown story");
  const external = input.stories.filter(
    (story): story is Exclude<SelectedStory, { id: string }> =>
      "open_library_id" in story
  );
  if (
    external.some(
      (story) =>
        !/^OL\d+W$/.test(story.open_library_id) ||
        !story.title.trim() ||
        !story.author.trim() ||
        !Number.isFinite(story.reading_min) ||
        story.reading_min <= 0 ||
        !story.source_url.startsWith("https://openlibrary.org/")
    )
  )
    throw new Error("Invalid external story");
  const selectionKeys = input.stories.map((story) =>
    "id" in story ? story.id : story.open_library_id
  );
  if (new Set(selectionKeys).size !== selectionKeys.length)
    throw new Error("Stories cannot be repeated");

  if (external.length) {
    const { error: externalError } = await supabase.from("stories").upsert(
      external.map((story) => ({
        title_es: story.title.slice(0, 300),
        title_en: story.title.slice(0, 300),
        author: story.author.slice(0, 300),
        genre_es: "Añadido por el usuario",
        genre_en: "User-added",
        reading_min: Math.min(2000, Math.round(story.reading_min)),
        source_url: story.source_url,
        cover_url: story.cover_url,
        open_library_id: story.open_library_id,
      })),
      { onConflict: "open_library_id" }
    );
    if (externalError) throw new Error(externalError.message);
  }

  const { data: internalRows } = internalIds.length
    ? await supabase.from("stories").select("id").in("id", internalIds)
    : { data: [] };
  if (internalRows?.length !== internalIds.length) throw new Error("Unknown story");
  const externalIds = external.map((story) => story.open_library_id);
  const { data: externalRows } = externalIds.length
    ? await supabase.from("stories").select("id, open_library_id").in("open_library_id", externalIds)
    : { data: [] };
  const externalMap = new Map(
    (externalRows ?? []).map((story: any) => [story.open_library_id, story.id])
  );
  const storyIds = input.stories.map((story) =>
    "id" in story ? story.id : externalMap.get(story.open_library_id)
  );
  if (storyIds.some((id) => !id)) throw new Error("Could not save external story");
  const { data: plan, error } = await supabase.from("reading_plans").insert({
    user_id: user.id,
    name: "Halloween Reading Marathon",
    start_date: days[0],
    end_date: days.at(-1),
  }).select("id").single();
  if (error || !plan) throw new Error(error?.message ?? "Could not create reading plan");
  const ids = shuffleInPlace([...storyIds]);
  const { error: daysError } = await supabase.from("reading_plan_days").insert(
    days.map((day, index) => ({ plan_id: plan.id, story_id: ids[index], day_date: day, status: "locked" }))
  );
  if (daysError) {
    await supabase.from("reading_plans").delete().eq("id", plan.id);
    throw new Error(daysError.message);
  }
  revalidatePath(`/reading/${plan.id}`);
  redirect(`/reading/${plan.id}`);
}
