"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEffectiveToday } from "@/lib/time";
import { revalidatePath } from "next/cache";

export async function setReadingStatusAction(dayId: string, status: "read" | "skipped") {
  const supabase = (await createSupabaseServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: day } = await supabase.from("reading_plan_days")
    .select("id, day_date, plan_id, plan:reading_plans(user_id)")
    .eq("id", dayId).maybeSingle();
  if (!day || day.plan?.user_id !== user.id) throw new Error("Not allowed");
  if (day.day_date > await getEffectiveToday()) throw new Error("Day is still locked");
  const { error } = await supabase.from("reading_plan_days").update({
    status,
    read_at: status === "read" ? new Date().toISOString() : null,
  }).eq("id", dayId);
  if (error) throw new Error(error.message);
  revalidatePath(`/reading/${day.plan_id}`);
}
