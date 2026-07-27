import RehacerPlanButton from "@/components/ResetButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEffectiveToday } from "@/lib/time";
import { assertPlanOwner } from "@/lib/plan-access";
import { redirect } from "next/navigation";
import SharePanel from "./share-panel";
import Calendar from "./ui-calendar";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  await assertPlanOwner(supabase, id, user.id);

  // Hoy como 'YYYY-MM-DD' (Europe/Madrid)
  const today = await getEffectiveToday();

  // (Opcional) actualizar estados en servidor al cargar
  await supabase
    .from("plan_days")
    .update({ status: "unlocked" })
    .lte("day_date", today)
    .is("watched_at", null)
    .eq("status", "locked")
    .eq("plan_id", id);

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!plan) redirect("/");

  const { data: rows } = await supabase
    .from("plan_days")
    .select(
      "id, day_date, status, movie:movies(id, title, poster_url, runtime_min, tags)"
    )
    .eq("plan_id", plan.id)
    .order("day_date");

  const { data: share } = await supabase
    .from("share_links")
    .select("token, created_at, expires_at")
    .eq("plan_id", plan.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-7xl py-8">
      <header className="flex flex-col sm:flex-row items-center justify-center">
        <div className="flex-1 sm:flex-2 mb-2 sm:mb-0">
          <h1 className="text-2xl font-semibold text-halloweenAccent ">
            {plan.name ?? "Mi plan"}
          </h1>
          <p className="text-white/70 text-sm">
            {plan.start_date} → {plan.end_date} · {rows?.length ?? 0} días
          </p>
        </div>

        <RehacerPlanButton planId={id} />
      </header>

      <SharePanel planId={plan.id} existingToken={share?.token ?? null} />

      {/* Pasamos 'today' para lógica de desbloqueo del día actual */}
      <Calendar days={(rows ?? []) as any} planId={plan.id} today={today} />
    </div>
  );
}
