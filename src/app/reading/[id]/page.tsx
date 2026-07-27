import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEffectiveToday } from "@/lib/time";
import { redirect } from "next/navigation";
import ReadingCalendar from "./reading-calendar";

export default async function ReadingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = (await createSupabaseServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data: plan } = await supabase.from("reading_plans").select("*")
    .eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!plan) redirect("/reading");
  const today = await getEffectiveToday();
  await supabase.from("reading_plan_days").update({ status: "unlocked" })
    .eq("plan_id", id).eq("status", "locked").lte("day_date", today);
  const { data: days, error } = await supabase.from("reading_plan_days")
    .select("id, day_date, status, story:stories(id,title_es,title_en,author,genre_es,genre_en,reading_min,source_url)")
    .eq("plan_id", id).order("day_date");
  if (error) throw new Error(error.message);
  return <ReadingCalendar plan={plan} days={days ?? []} today={today} />;
}
