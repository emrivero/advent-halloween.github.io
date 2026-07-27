"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";

export default function PlanButtonClient() {
  const [supabase] = useState(createSupabaseBrowserClient);
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};

    (async () => {
      // 1) Sesión actual
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setLoading(false);

      // 2) Suscripción a cambios (login/logout/refresh)
      const { data: sub } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setEmail(session?.user?.email ?? null);
          // Forzamos un refresh de datos del servidor si lo necesitas:
          router.refresh();
        }
      );
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => unsub();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="h-9 w-28 animate-pulse rounded-md border border-white/10 bg-white/5" />
    );
  }

  if (email) {
    return (
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center bgcolor-[#f0a500]">
        <Link
          href="/auth"
          className="inline-flex items-center justify-center rounded-lg bg-[#f0a500] text-gray-900 px-4 py-2 
                font-medium hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          {t("goToPlan")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center bgcolor-[#f0a500]">
      <Link
        href="/auth"
        className="inline-flex items-center justify-center rounded-lg bg-[#f0a500] text-gray-900 px-4 py-2 
                font-medium hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white/40"
      >
        {t("createPlan")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
      <span className="text-sm text-white/60">{t("quickLogin")}</span>
    </div>
  );
}
