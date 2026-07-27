import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReadingChooseClient from "./reading-choose-client";

export default async function ReadingChoosePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: raw = "" } = await searchParams;
  const days = raw.split(",").filter(Boolean).sort();
  if (!days.length) redirect("/reading/setup");
  const supabase = (await createSupabaseServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data: stories, error } = await supabase.from("stories").select("*").order("author").order("title_es");
  if (error) throw new Error(error.message);
  return <ReadingChooseClient days={days} stories={stories ?? []} />;
}
