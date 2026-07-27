import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReadingSetupClient from "./reading-setup-client";

export default async function ReadingSetupPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  return <ReadingSetupClient />;
}
