"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertDayOwner, assertPlanOwner } from "@/lib/plan-access";
import { getEffectiveToday } from "@/lib/time";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function unlockTodayAction(planId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  await assertPlanOwner(supabase, planId, user.id);

  // Hoy como YYYY-MM-DD en Europe/Madrid (tu función ya lo da así)
  const today = await getEffectiveToday();

  // Desbloquear todo <= hoy que siga locked y no esté visto
  const { error } = await supabase
    .from("plan_days")
    .update({ status: "unlocked" })
    .lte("day_date", today) // day_date es DATE
    .is("watched_at", null)
    .eq("status", "locked")
    .eq("plan_id", planId);

  if (error) throw new Error(error.message);

  // Revalidar la página del plan
  revalidatePath(`/plan/${planId}`, "page");
}

export async function setDayStatusAction(
  dayId: string,
  status: "watched" | "skipped",
  planId?: string
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const day = await assertDayOwner(supabase, dayId, user.id);
  if (day.day_date > (await getEffectiveToday()))
    throw new Error("No se puede modificar un día todavía bloqueado");

  const patch: any = { status };
  if (status === "watched") patch.watched_at = new Date().toISOString();
  if (status !== "watched") patch.watched_at = null;

  const { error } = await supabase
    .from("plan_days")
    .update(patch)
    .eq("id", dayId);

  if (error) throw new Error(error.message);

  revalidatePath(`/plan/${planId ?? day.plan_id}`, "page");
}

export async function deletePlanAction(formData: FormData) {
  const planId = formData.get("planId") as string;
  if (!planId) throw new Error("Falta planId");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  await assertPlanOwner(supabase, planId, user.id);

  // Si NO tienes ON DELETE CASCADE, borra días primero
  const { error: daysErr } = await supabase
    .from("plan_days")
    .delete()
    .eq("plan_id", planId);
  if (daysErr) throw new Error(daysErr.message);

  const { error: delErr } = await supabase
    .from("plans")
    .delete()
    .eq("id", planId);
  if (delErr) throw delErr;

  revalidatePath("/plan");
  redirect("/plan/setup");
}
