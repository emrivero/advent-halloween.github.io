import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlanSetupClient from "./PlanSetupClient";
import { getI18n } from "@/i18n/server";

export default async function PlanSetupPage() {
  const { t } = await getI18n();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="text-3xl font-bold text-[#f0a500]">
        {t("setupTitle")}
      </h1>

      <PlanSetupClient />
    </div>
  );
}
