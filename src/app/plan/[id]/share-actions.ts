"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertPlanOwner } from "@/lib/plan-access";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

function token() {
  return randomBytes(16).toString("hex"); // 32 chars
}

export async function createShareLinkAction(planId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("No autenticado");
  await assertPlanOwner(supabase, planId, user.id);

  const t = token();
  const { data, error: upErr } = await supabase
    .from("share_links")
    .upsert(
      {
        plan_id: planId,
        token: t,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "plan_id" }
    )
    .select("token")
    .single();

  if (upErr || !data)
    throw new Error(upErr?.message ?? "Error creando share link");
  revalidatePath(`/plan/${planId}`);
  return { token: data.token };
}

export async function revokeShareLinkAction(planId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("No autenticado");
  await assertPlanOwner(supabase, planId, user.id);

  const { error: delErr } = await supabase
    .from("share_links")
    .delete()
    .eq("plan_id", planId);
  if (delErr) throw new Error(delErr.message);

  revalidatePath(`/plan/${planId}`);
  return { ok: true };
}
