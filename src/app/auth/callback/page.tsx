"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const [supabase] = useState(createSupabaseBrowserClient);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // detectSessionInUrl=true ya procesó el token al montar esta página
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // si no hay user, muestra un fallback o vuelve a /auth
      if (!user) return router.replace("/auth?err=no-session");

      const { data: plan } = await supabase
        .from("plans")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      router.replace(plan ? `/plan/${plan.id}` : "/plan/setup");
    })();
  }, [router, supabase]);

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-2xl font-semibold">Accediendo…</h1>
      <p className="text-white/70">Estamos validando tu sesión.</p>
    </div>
  );
}
