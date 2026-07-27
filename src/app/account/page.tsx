import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getI18n } from "@/i18n/server";

export default async function AccountPage() {
  const { t } = await getI18n();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="py-10">
      <h1 className="text-2xl font-semibold">{t("accountHello", { email: user.email ?? "" })}</h1>
      <p className="text-gray-300">{t("accountIntro")}</p>
    </div>
  );
}
