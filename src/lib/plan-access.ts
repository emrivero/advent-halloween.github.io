import "server-only";

type SupabaseClient = Awaited<
  ReturnType<typeof import("./supabase/server").createSupabaseServerClient>
>;

export async function assertPlanOwner(
  supabase: SupabaseClient,
  planId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) throw new Error("Plan no encontrado o sin permiso");
  return data;
}

export async function assertDayOwner(
  supabase: SupabaseClient,
  dayId: string,
  userId: string
) {
  const { data: day, error } = await supabase
    .from("plan_days")
    .select("id, plan_id, day_date")
    .eq("id", dayId)
    .maybeSingle();

  if (error || !day) throw new Error("Día no encontrado o sin permiso");
  await assertPlanOwner(supabase, day.plan_id, userId);
  return day;
}
